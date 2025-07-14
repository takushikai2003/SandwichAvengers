import { connect, disconnect, broadcastMessage } from "./deviceManager.js";

document.getElementById("connectBtn1").addEventListener("click", async () => {
    connect(0);
});

document.getElementById("connectBtn2").addEventListener("click", async () => {
    connect(1);
});

document.getElementById("disconnectBtn1").addEventListener("click", async () => {
    disconnect(0);
});

document.getElementById("disconnectBtn2").addEventListener("click", async () => {
    disconnect(1);
});

document.getElementById("sendBtn").addEventListener("click", async () => {
    const message = "Hello, こんにちは世界";
    try {
        await broadcastMessage(message);
    } catch (err) {
        console.error('メッセージ送信エラー:', err);
    }
});