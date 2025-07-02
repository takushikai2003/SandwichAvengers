document.addEventListener('DOMContentLoaded', function() {
    // デバイスステータス
    const devices = [
        {
            id: 1,
            port: null,
            connected: false,
            connectBtn: document.getElementById('connectBtn1'),
            disconnectBtn: document.getElementById('disconnectBtn1'),
            statusIndicator: document.getElementById('statusIndicator1'),
            statusText: document.getElementById('statusText1'),
            previewDate: document.getElementById('previewDate1'),
            previewText: document.getElementById('previewText1')
        },
        {
            id: 2,
            port: null,
            connected: false,
            connectBtn: document.getElementById('connectBtn2'),
            disconnectBtn: document.getElementById('disconnectBtn2'),
            statusIndicator: document.getElementById('statusIndicator2'),
            statusText: document.getElementById('statusText2'),
            previewDate: document.getElementById('previewDate2'),
            previewText: document.getElementById('previewText2')
        }
    ];
    

    const eventDate = document.getElementById('eventDate');
    const eventTime = document.getElementById('eventTime');
    const eventContent = document.getElementById('eventContent');
    const eventHistory = document.getElementById('eventHistory');
    const sendBtn = document.getElementById('sendBtn');
    const clearBtn = document.getElementById('clearBtn');
    const messageDiv = document.getElementById('message');
    
    // デフォルトの日付と時刻を設定する
    function setCurrentDateTime() {
        const now = new Date();
        
        // 日付を設定（YYYY-MM-DD）
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        eventDate.value = `${year}-${month}-${day}`;
        
        // 時刻設定（HH:MM）
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        eventTime.value = `${hours}:${minutes}`;
        
        updatePreview();
    }
    
    // アップデートプレビュー
    function updatePreview() {
        const date = new Date(eventDate.value);
        const time = eventTime.value;
        const content = eventContent.value.trim();
        
        // 日付表示のフォーマット
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const formattedDate = `${year}年${month}月${day}日`;
        
        // すべてのデバイスのプレビューを更新
        devices.forEach(device => {
            device.previewDate.textContent = formattedDate;
            
            if (!content) {
                device.previewText.innerHTML = 'イベントデータを待機中...';
            } else {
                device.previewText.innerHTML = content;
            }
        });
    }
    
    // デバイスのステータスを更新する
    function updateDeviceStatus(device) {
        if (device.connected) {
            device.statusIndicator.className = 'status-indicator connected';
            device.statusText.textContent = '接続';
            device.connectBtn.disabled = true;
            device.disconnectBtn.disabled = false;
        } else {
            device.statusIndicator.className = 'status-indicator';
            device.statusText.textContent = '未接続';
            device.connectBtn.disabled = false;
            device.disconnectBtn.disabled = true;
        }
        
        // 少なくとも1つのデバイスが接続されているかどうかを確認する
        const anyConnected = devices.some(d => d.connected);
        sendBtn.disabled = !anyConnected;
    }
    
    // メッセージを表示
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type} show`;
        
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => {
                messageDiv.className = 'message';
            }, 400);
        }, 3000);
    }
    
    // 初期化
    setCurrentDateTime();
    devices.forEach(updateDeviceStatus);
    
    // 入力イベントリスナー
    eventDate.addEventListener('change', updatePreview);
    eventTime.addEventListener('change', updatePreview);
    eventContent.addEventListener('input', updatePreview);
    
    // 各デバイスのイベントリスナーを設定する
    devices.forEach(device => {
        // 连接设备
        device.connectBtn.addEventListener('click', async () => {
            try {
                // シリアルポートのアクセス許可を要求する
                device.port = await navigator.serial.requestPort();
                
                // ポートを開く
                await device.port.open({ baudRate: 115200 });
                
                // デバイスのステータスを更新する
                device.connected = true;
                updateDeviceStatus(device);
                
                showMessage(`${device.id} 接続成功！`, 'success');
            } catch (err) {
                console.error('接続エラー:', err);
                showMessage(` ${device.id} 接続失敗: ${err.message}`, 'error');
            }
        });
        
        // デバイスを切断
        device.disconnectBtn.addEventListener('click', async () => {
            try {
                if (device.port) {
                    await device.port.close();
                    device.port = null;
                }
                
                //  設備の状態を更新
                device.connected = false;
                updateDeviceStatus(device);
                
                showMessage(`设备 ${device.id} 已断开`, 'info');
            } catch (err) {
                console.error('断开连接错误:', err);
                showMessage(`设备 ${device.id} 断开失败: ${err.message}`, 'error');
            }
        });
    });
    
    // 送信ボタン
    sendBtn.addEventListener('click', async () => {
        const dateStr = eventDate.value;
        const timeStr = eventTime.value;
        const content = eventContent.value.trim();
        
        if (!content) {
            showMessage('イベント内容を入力してください', 'error');
            return;
        }
        
        // 创建日期对象
        const date = new Date(dateStr);
        
        // 提取日期组成部分
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        // 格式化时间
        const [hours, minutes] = timeStr.split(':');
        
        // 创建要发送的数据（包含年份）
        // 格式: [YYYY-MM-DD HH:MM] 内容
        const dataToSend = `[${year}-${month}-${day} ${hours}:${minutes}] ${content}\r\n`;
        
        let successCount = 0;
        let errorCount = 0;
        
        // 接続されているすべてのデバイスにデータを送信します
        for (const device of devices) {
            if (device.connected && device.port) {
                try {
                    const writer = device.port.writable.getWriter();
                    // テキストをバイトストリームにエンコードして送信する
                    await writer.write(new TextEncoder().encode(dataToSend));
                    writer.releaseLock();
                    successCount++;
                } catch (err) {
                    console.error(`デバイス ${device.id} に送信失敗:`, err);
                    errorCount++;
                }
            }
        }
        
        // 結果を表示
        if (successCount > 0) {
            showMessage(`送信成功 ${successCount} デバイス${errorCount > 0 ? `, ${errorCount} 个设备失败` : ''}`, 'success');
            
            // 履歴に追加
            addToHistory(year, month, day, hours, minutes, content);
            
            // コンテンツをクリア
            eventContent.value = '';
            updatePreview();
        } else {
            showMessage('どのデバイスもメッセージを正常に受信できませんでした', 'error');
        }
    });
    
    // クリアボタン
    clearBtn.addEventListener('click', () => {
        eventContent.value = '';
        updatePreview();
    });
    
    // 履歴に追加
    function addToHistory(year, month, day, hours, minutes, content) {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="event-date">${year}-${month}-${day}<br>${hours}:${minutes}</div>
            <div class="event-content">${content}</div>
            <div class="event-actions">
                <button class="event-btn resend-btn">
                    <i class="fas fa-redo"></i> 重新广播
                </button>
            </div>
        `;
        
        // 再送信機能を追加
        li.querySelector('.resend-btn').addEventListener('click', () => {
            eventDate.value = `${year}-${month}-${day}`;
            eventTime.value = `${hours}:${minutes}`;
            eventContent.value = content;
            updatePreview();
            sendBtn.click();
        });
        
        eventHistory.insertBefore(li, eventHistory.firstChild);
        
        // 履歴レコードの数を制限する
        if (eventHistory.children.length > 5) {
            eventHistory.removeChild(eventHistory.lastChild);
        }
    }
    
    // サンプルイベントの追加
    function addSampleEvents() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        
        // タスクのサンプルデータ
        const samples = [
            {time: '09:30', content: '团队每日站会'},
            {time: '11:00', content: '客户演示会议'},
            {time: '14:15', content: '项目进度评审'},
            {time: '16:45', content: '代码审查会议'}
        ];
        
        samples.forEach(sample => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="event-date">${year}-${month}-${day}<br>${sample.time}</div>
                <div class="event-content">${sample.content}</div>
                <div class="event-actions">
                    <button class="event-btn resend-btn">
                        <i class="fas fa-redo"></i> 再送信
                    </button>
                </div>
            `;
            
            li.querySelector('.resend-btn').addEventListener('click', () => {
                eventDate.value = `${year}-${month}-${day}`;
                eventTime.value = sample.time;
                eventContent.value = sample.content;
                updatePreview();
            });
            
            eventHistory.appendChild(li);
        });
    }
    
    // サンプルイベントの追加
    addSampleEvents();
});
