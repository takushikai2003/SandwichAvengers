import { joinOrCreateRoom } from "./WebRtcManager.js";

let room;

document.querySelector('#enter').addEventListener('click', async () => {
    const roomId = document.querySelector('#roomId').value || Math.random().toString(36).slice(2, 8);
    document.querySelector('#roomId').value = roomId;

    room = await joinOrCreateRoom(roomId);
    room.addEventListener("message", e=>{
        console.log("recieved: ", e.detail.message);
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