import { Todo } from "../Todo/Todo.js";
import { ProgressBar } from "../progressBar/ProgressBar.js";
import { isLogin, getUserProfile } from "../lib/firebaseCommon.js";
import { loadCSS } from "../lib/loadCss.js";

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