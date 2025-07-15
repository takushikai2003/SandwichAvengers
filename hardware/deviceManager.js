import { utf8togbk } from './utf8togbk.js';


// デバイスステータス
const devices = [
    {
        id: 0,
        port: null,
        connected: false,
    },
    {
        id: 1,
        port: null,
        connected: false,
    }
];


export async function connect(id){
    try {
        // シリアルポートのアクセス許可を要求する
        devices[id].port = await navigator.serial.requestPort();
        
        // ポートを開く
        await devices[id].port.open({ baudRate: 115200 });
        
        // デバイスのステータスを更新する
        devices[id].connected = true;
        
        console.log(`device ${id} 接続成功！`);
    }
    catch (err) {
        console.error('接続エラー:', err);
        console.log(` ${id} 接続失敗: ${err.message}`);
    }
}

export async function disconnect(id){
    try {
        if (devices[id].port) {
            await devices[id].port.close();
            devices[id].port = null;
        }
        
        //  デバイスの状態を更新
        devices[id].connected = false;
        
        console.log(`デバイス ${id}切断`);
    } catch (err) {
        console.error('切断エラー:', err);
        console.log(`デバイス ${id} 切断に失敗しました: ${err.message}`);
    }
}


// ★ ヘルパー: Base64 → Uint8Array
function base64ToUint8Array(b64) {
    const bin = atob(b64);                     // 生バイト列（Unicode 0–255 範囲の文字列）
    return Uint8Array.from(bin, ch => ch.charCodeAt(0));
}

export async function broadcastMessage(message){
    if (!message) {
        console.error('イベント内容を入力してください', 'error');
        return;
    }

    // ① UTF‑8 → GBK → Base64 された文字列を取得
    const gbk_base64 = await utf8togbk(message);

    // ② Base64 を GBKバイト列へデコード
    const gbkBytes = base64ToUint8Array(gbk_base64);

    // ③ 日時ヘッダーを組み立て（ASCII 部分なので UTF‑8/GBK どちらでも同じバイト値）
    const now      = new Date();
    const year     = now.getFullYear();
    const month    = (now.getMonth() + 1).toString().padStart(2, '0');
    const day      = now.getDate().toString().padStart(2, '0');
    const hours    = now.getHours().toString().padStart(2, '0');
    const minutes  = now.getMinutes().toString().padStart(2, '0');

    const headerStr   = `[${year}-${month}-${day} ${hours}:${minutes}] `;
    const headerBytes = new TextEncoder().encode(headerStr); // ASCII 部分

    // ④ 改行 (\r\n)
    const crlfBytes = new Uint8Array([0x0d, 0x0a]);

    // ⑤ ヘッダー + 本文(GBK) + 改行 を 1 本の Uint8Array に連結
    const dataToSend = new Uint8Array(
        headerBytes.length + gbkBytes.length + crlfBytes.length
    );
    dataToSend.set(headerBytes, 0);
    dataToSend.set(gbkBytes, headerBytes.length);
    dataToSend.set(crlfBytes, headerBytes.length + gbkBytes.length);

    // ⑥ 各デバイスへ送信
    let successCount = 0;
    let errorCount   = 0;

    for (const device of devices) {
        if (device.connected && device.port) {
            try {
                const writer = device.port.writable.getWriter();
                await writer.write(dataToSend);   // ← 文字列ではなくバイト列を送信
                writer.releaseLock();
                successCount++;
            } catch (err) {
                console.error(`デバイス ${device.id} に送信失敗:`, err);
                errorCount++;
            }
        }
    }

    // ⑦ フィードバック
    if (successCount > 0) {
        console.log(`送信成功 ${successCount} デバイス${errorCount ? `, ${errorCount} デバイス失敗` : ''}`);
    } else {
        console.error('どのデバイスもメッセージを正常に受信できませんでした');
    }
}