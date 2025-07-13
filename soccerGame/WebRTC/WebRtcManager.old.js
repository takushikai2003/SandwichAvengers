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
import { guestLogin, setupPresence } from '../../lib/firebaseCommon.js';

await guestLogin();
setupPresence();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
        if(this?.channel.readyState === "open"){
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
            await addDoc(sendCandidatesRef, e.candidate.toJSON());
        }
    });

    pc.addEventListener('datachannel', e => {
        setupDataChannelEvents(e.channel, room);
    });

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

/**
 * 
 * @param {string} roomId 
 */
export function joinOrCreateRoom(roomId){
    return new Promise(async (resolve, reject) => {
        if(!roomId){
            console.error("no room id");
            reject("no-room-id");
        }

        let room;
        joinRoom(roomId)
        .then(rm=>{
            room = rm;
            resolve(room);
        })
        .catch(async err => {
            if(err === "room-not-exists" || err === "join-room-error"){
                room = await createRoom(roomId);
                resolve(room);
            }
            else{
                reject(err);
            }
        });
    });
}

/**
 * 
 * @param {string} roomId 
 */
export async function createRoom(roomId){
    if(!roomId){
        console.error("no room id");
        return false;
    }

    const roomRef = doc(db, 'rooms', roomId);
    const sendCandidatesRef = collection(roomRef, 'callerCandidates');
    const recvCandidatesRef = collection(roomRef, 'calleeCandidates');

    const room = new Room(roomId);

    const pc = createPeerConnection(sendCandidatesRef, room);

    const dataChannel = pc.createDataChannel('chat');
    setupDataChannelEvents(dataChannel, room);

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


    return room;

}


/**
 * 
 * @param {string} roomId 
 */
export function joinRoom(roomId){
    return new Promise(async (resolve, reject) => {
        if(!roomId){
            console.error("no room id");
            reject("no-room-id");
        }

        const roomsQuery = collection(db, 'rooms');
        const roomDocs = await getDoc(doc(roomsQuery, roomId));
        if (!roomDocs.exists()) reject("room-not-exists");

        try{
            const roomRef = doc(db, 'rooms', roomId);
            const sendCandidatesRef = collection(roomRef, 'calleeCandidates');
            const recvCandidatesRef = collection(roomRef, 'callerCandidates');

            const room  = new Room(roomId);
            const pc = createPeerConnection(sendCandidatesRef, room);

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

            console.log('[Joined Room]', roomId);

            resolve(room);
        }
        catch(err){
            console.error("Error joining room: ", err);
            reject("join-room-error");
        }

        
    });
}