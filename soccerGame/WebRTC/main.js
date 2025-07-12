import { createRoom, joinRoom } from "./WebRtcManager.js";

let room;


document.querySelector('#create').addEventListener('click', async () => {
    const roomId = document.querySelector('#roomId').value || Math.random().toString(36).slice(2, 8);
    document.querySelector('#roomId').value = roomId;

    room = await createRoom(roomId);
    room.addEventListener("message", e=>{
        console.log("recieved: ", e.detail.message);
        log('⬅️', e.detail.message);
    });
});


document.querySelector('#join').addEventListener('click', async () => {
    const roomId = document.querySelector('#roomId').value.trim();
    if (!roomId) return alert('Room ID を入力してください');

    room = await joinRoom(roomId);
    room.addEventListener("message", e=>{
        log('⬅️', e.detail.message);
    });
});

document.querySelector('#localMsg').addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        const msg = e.target.value;
        if(room.sendMessage(msg)){
            log('➡️', msg);
            e.target.value = '';
        }
    }
});

function log(...args) {
    document.querySelector('#log').textContent += args.join(' ') + '\n';
}