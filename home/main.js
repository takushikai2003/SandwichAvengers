import { isLogin, getUserProfile, updateUserProfile } from "../lib/firebaseCommon.js";
import { loadProfile } from './profile.js';

// ログインしていなければログイン画面に戻す
if(!(await isLogin())) {
    window.location.href = "../index.html";
}

loadProfile();

document.getElementById("go_todo").addEventListener("click", function(event) {
    console.log("To-Do List button clicked");
    window.location.href = "../TaskManagement"; // Redirect to the To-Do List page
});