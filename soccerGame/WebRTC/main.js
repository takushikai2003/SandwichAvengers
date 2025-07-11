import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  addDoc,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

import { firebaseConfig } from '../../env/firebaseConfig.js';
import { guestLogin } from '../../lib/firebaseCommon.js';

await guestLogin();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- グローバル変数 ---
let pc, channel;
let roomRef, sendCandidatesRef, recvCandidatesRef;

const servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// --- イベントハンドラ定義 ---
function log(...args) {
  document.querySelector('#log').textContent += args.join(' ') + '\n';
}

function setupDataChannelEvents(ch) {
  channel = ch;
  channel.onopen = () => {
    log('[DataChannel] open');
    document.querySelector('#chat').style.display = 'block';
  };
  channel.onmessage = e => log('⬅️', e.data);
}

// --- Peer 接続セットアップ ---
function createPeerConnection() {
  pc = new RTCPeerConnection(servers);

  pc.addEventListener('icecandidate', async e => {
    if (e.candidate) {
      await addDoc(sendCandidatesRef, e.candidate.toJSON());
    }
  });

  pc.addEventListener('datachannel', e => {
    setupDataChannelEvents(e.channel);
  });
}

// --- Create ボタン処理 ---
document.querySelector('#create').addEventListener('click', async () => {
  const roomId = document.querySelector('#roomId').value || Math.random().toString(36).slice(2, 8);
  document.querySelector('#roomId').value = roomId;

  roomRef = doc(db, 'rooms', roomId);
//   console.log('Creating room:', roomRef);
  sendCandidatesRef = collection(roomRef, 'callerCandidates');
  recvCandidatesRef = collection(roomRef, 'calleeCandidates');

  createPeerConnection();

  const dataChannel = pc.createDataChannel('chat');
  setupDataChannelEvents(dataChannel);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  await setDoc(roomRef, { roomId, offer });

  onSnapshot(roomRef, async snapshot => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      await pc.setRemoteDescription(data.answer);
    }
  });

  onSnapshot(recvCandidatesRef, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });

  log('[Room created]', roomId);
});

// --- Join ボタン処理 ---
document.querySelector('#join').addEventListener('click', async () => {
  const roomId = document.querySelector('#roomId').value.trim();
  if (!roomId) return alert('Room ID を入力してください');

  const roomsQuery = collection(db, 'rooms');
  const roomDocs = await getDoc(doc(roomsQuery, roomId));
  if (!roomDocs.exists()) return alert('Room が存在しません');

  roomRef = doc(db, 'rooms', roomId);
  sendCandidatesRef = collection(roomRef, 'calleeCandidates');
  recvCandidatesRef = collection(roomRef, 'callerCandidates');

  createPeerConnection();

  const offer = roomDocs.data().offer;
  await pc.setRemoteDescription(offer);

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await updateDoc(roomRef, { answer });

  onSnapshot(recvCandidatesRef, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });

  log('[Joined Room]', roomId);
});

// --- メッセージ送信 ---
document.querySelector('#localMsg').addEventListener('keypress', e => {
  if (e.key === 'Enter' && channel?.readyState === 'open') {
    const msg = e.target.value;
    channel.send(msg);
    log('➡️', msg);
    e.target.value = '';
  }
});