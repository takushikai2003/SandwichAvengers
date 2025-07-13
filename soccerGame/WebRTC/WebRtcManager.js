import { firebaseConfig } from '../../env/firebaseConfig.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { guestLogin, setupPresence } from '../../lib/firebaseCommon.js';
import {
  getDatabase, ref, child, set, update, push, get,
  onValue, onChildAdded, remove, onDisconnect, runTransaction
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";


await guestLogin();
setupPresence();

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);


const servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

/**
 * @event Room#dataChannelOpen
 * @event Room#message
 */
class Room extends EventTarget{
    constructor(roomId){
        super();
        this.roomId = roomId;
        this.channel = null; //readyState

    }

    emitEvent(eventType, detail){
        this.dispatchEvent(new CustomEvent(eventType, {detail: detail}));
    }

    sendMessage(message){
        if(this.channel?.readyState === "open"){
            this.channel.send(message);
            return true;
        }
        else{
            return false;
        }
        
    }
}


/**
 * 
 * @param {*} sendCandidatesRef
 * @param {Room} room 
 */
function createPeerConnection(sendCandidatesRef, room) {
    const pc = new RTCPeerConnection(servers);

    pc.addEventListener('icecandidate', async e => {
        if (e.candidate) {
            push(sendCandidatesRef, e.candidate.toJSON());
        }
    });

    pc.addEventListener('datachannel', e => {
        setupDataChannelEvents(e.channel, room);
    });

    pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === 'disconnected' || s === 'failed' || s === 'closed') {
            // ルームを空ける
            console.log(`[PC‑${room.id}] disconnected ⇒ clearing room`);
            remove(ref(rtdb, `rooms/${room.id}`));
        }
    };

    return pc;
}




/**
 * 
 * @param {*} ch 
 * @param {Room} room 
 */
function setupDataChannelEvents(ch, room) {
    room.channel = ch;
    ch.onopen = () => {
        room.emitEvent("dataChannelOpen");
    };

    ch.onmessage = e => {
        room.emitEvent("message", {message: e.data});
    };
}



export function joinOrCreateRoom(roomId){
  console.log("joinOrCreateRoom", roomId);
  
    return new Promise(async (resolve, reject) => {
        if(!roomId){
            console.error("no room id");
            reject("no-room-id");
        }

        let room;
        createRoom(roomId)
          .then(rm=>{
              room = rm;
              resolve(room);
          })
          .catch(async err => {
            console.log("try join")
            room = await joinRoom(roomId);
            resolve(room);
          });
    });
}



// ルームに参加できるかチェックして参加枠を確保する
async function tryEnterRoom(roomId, role) {
  const roomRef = ref(rtdb, `rooms/${roomId}`);

  // トランザクションで「caller」または「callee」フィールドを独占的に確保する
  // roleは "caller" または "callee"
  return new Promise((resolve, reject) => {
    // Firebaseトランザクションで枠を確保する
    // 「枠が空なら入れる、埋まってたら拒否」
    runTransaction(roomRef, (room) => {
      if (room === null) {
        // ルームがなければ初期化
        room = {};
      }
      
      if (!room[role]) {
        // まだ埋まってなければ入る
        room[role] = true;  // ここはユーザーIDやtrueなど好きな値で
        return room;
      } else {
        // 埋まってたらトランザクション失敗扱いにする
        return; // トランザクションを中止
      }
    }, {
      // トランザクション完了時のコールバック
      // Firebase SDKのバージョンによって書き方が違うので注意してください
    }).then(({committed, snapshot}) => {
      if (committed) {
        resolve(true);
      } else {
        resolve(false);//埋まっていた
      }
    }).catch(err => {
      reject(err);
    });
  });
}



/* --------------------------------------------------
   ① createRoom  ＝ 発呼側
--------------------------------------------------- */
export function createRoom(roomId) {
  return new Promise(async (resolve, reject) => {
    // caller枠を確保できるか
    if(!(await tryEnterRoom(roomId, 'caller'))){
      console.error("Room already exists or is full");
      reject();
    }
    
    if (!roomId) {
      console.error('no room id');
      reject();
    }

    // RTDB 参照
    const roomRef            = ref(rtdb, `rooms/${roomId}`);
    const callerCandidates   = child(roomRef, 'callerCandidates');
    const calleeCandidates   = child(roomRef, 'calleeCandidates');

    // ルームモデル（任意のクラス）
    const room = new Room(roomId);

    // RTCPeerConnection
    const pc = createPeerConnection(callerCandidates, room);

    // DataChannel（任意）
    const dc = pc.createDataChannel('chat');
    setupDataChannelEvents(dc, room);

    // Offer を生成
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // RTDB に部屋情報を書き込む
    await update(roomRef, {
      roomId,
      offer: offer
    });

    // 予期せぬ切断時にもルームを削除
    onDisconnect(child(roomRef, 'caller')).remove();

    /* 相手からの Answer を待つ */
    onValue(roomRef, async snap => {
      const data = snap.val();
      // if (data?.answer && !pc.currentRemoteDescription) {
      //   await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      // }
      if (!pc.currentRemoteDescription && data && data.answer && data.answer.type) {
          await pc.setRemoteDescription(data.answer);
      }
    });

    /* 相手からの ICE を受信 */
    onChildAdded(calleeCandidates, async snap => {
      const cand = snap.val();
      await pc.addIceCandidate(new RTCIceCandidate(cand));
    });

    console.log('[Room created]', roomId);
    
    resolve(room);
  });

  
}

/* --------------------------------------------------
   ② joinRoom  ＝ 着呼側
--------------------------------------------------- */
export function joinRoom(roomId) {
  return new Promise(async (resolve, reject) => {
    // callee枠を確保できるか
    if(!(await tryEnterRoom(roomId, 'callee'))){
      return reject("room-not-exists");
    }

    if (!roomId) {
      console.error('no room id');
      return reject('no-room-id');
    }

    try {
        const roomRef          = ref(rtdb, `rooms/${roomId}`);
        const snapshot         = await get(roomRef);
        if (!snapshot.exists()) return reject('room-not-exists');

        const { offer }        = snapshot.val();
        const room             = new Room(roomId);

        const calleeCandidates = child(roomRef, 'calleeCandidates');
        const callerCandidates = child(roomRef, 'callerCandidates');
        const pc               = createPeerConnection(calleeCandidates, room);

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await update(roomRef, { answer: answer });

        /* 相手（caller）からの ICE */
        onChildAdded(callerCandidates, async snap => {
        const cand = snap.val();
        await pc.addIceCandidate(new RTCIceCandidate(cand));
        });

        /* 予期せぬ切断時もルーム削除 */
        onDisconnect(child(roomRef, 'callee')).remove();

        console.log('[Joined Room]', roomId);
        resolve(room);
    }
    catch (err) {
        // console.error('joinRoom error:', err);
        return reject('join-room-error');
    }

    
  });
}
