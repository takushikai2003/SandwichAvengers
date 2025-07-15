import { Todo } from "../Todo/Todo.js";
import { ProgressBar } from "../progressBar/ProgressBar.js";
import { isLogin, getUserProfile } from "../lib/firebaseCommon.js";
import { loadCSS } from "../lib/loadCss.js";
import { connect, disconnect, broadcastMessage } from "../hardware/deviceManager.js";


// ログインしていなければログイン画面に戻す
if(!(await isLogin())) {
    console.log("User not logged in, redirecting to login page.");
    window.location.href = "../index.html";
}

const profile = await getUserProfile();

if(!profile.mbtiType) {
    console.error("MBTI type not found in user profile.");
    alert("MBTI type is not set in your profile. Please set it first.");
    window.location.href = "../select";
}

const mbti = profile.mbtiType.toUpperCase();

// 右側に表示するもの
let todo_content;
// P
if(mbti.includes("P")){
    todo_content = new Todo("P");
}
// J
else{
    todo_content = new Todo("J");
}

// 左側に表示するもの
let progress_bar;
// S
if(mbti.includes("S")){
    progress_bar = new ProgressBar(new Date(), 100);
}
// N
else{
    progress_bar = new ProgressBar(new Date(), 7);
}

// シンプル
if(mbti.includes('T')) {
// if(false){//test用
    console.log("load simple theme");
    loadCSS(new URL("./simpleTheme.css", import.meta.url));
}
else{
    console.log("load colorful theme");
    loadCSS(new URL("./colorfulTheme.css", import.meta.url));
}

// 表示
const left_area = document.getElementById("left_area");
const right_area = document.getElementById("right_area");

left_area.insertAdjacentElement("afterbegin", progress_bar.elem);
right_area.appendChild(todo_content.elem);


// 最初に完了状態にする（最初はタスクが設定されていないため）
progress_bar.completeDate(new Date());


// Todoの状態が変わるごとに、完了しているかの表示を更新
todo_content.addEventListener("stateChanged", (e) => {
    if(todo_content.count == 0){
        progress_bar.completeDate(new Date());
    }
    else{
        progress_bar.incompleteDate(new Date());
    }
});


// -------------- デバイス設定モーダル -------------
document.getElementById("device_setup_open").addEventListener("click", () => {
    document.getElementById("modal").classList.remove("hidden");
    document.getElementById("modal-overlay").classList.remove("hidden");
});

document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("modal").classList.add("hidden");
    document.getElementById("modal-overlay").classList.add("hidden");
});

// デバイスを接続
document.getElementById("connect_device_1").addEventListener("click", async () => {
    if(await connect(0)){
        document.getElementById("device_1_status").textContent = "接続済み";
    }
    else{
        document.getElementById("device_1_status").textContent = "接続失敗";
    }
});
document.getElementById("connect_device_2").addEventListener("click", async () => {
    if(await connect(1)){
        document.getElementById("device_2_status").textContent = "接続済み";
    }
    else{
        document.getElementById("device_2_status").textContent = "接続失敗";
    }
});

// 10秒ごとに完了していないタスクをランダムにデバイスに送信
setInterval(async () => {
    // 現在完了していないタスクを取得
    const incompleteTasks = todo_content.getIncompleteTasks();
    // ランダムに一つ選ぶ
    const incompleteTask = incompleteTasks[Math.floor(Math.random() * incompleteTasks.length)] || null;
    if(incompleteTask) {
        try {
            // デバイスに送信
            await broadcastMessage(incompleteTask.text);
            console.log("send:", incompleteTask.text);
        } catch (error) {
            console.error("Error broadcasting message:", error);
        }
    }
    
    
}, 10000);
