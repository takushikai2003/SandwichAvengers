import { isLogin, getUserProfile, updateUserProfile } from "../lib/firebaseCommon.js";

// ログインしていなければログイン画面に戻す
if(!(await isLogin())) {
    window.location.href = "../index.html";
}

const avatars = ["warrior.png", "mage.png", "healer.png", "rogue.png"];
let selectedAvatar = null;//:name

function renderAvatars() {
    const grid = document.getElementById("avatarGrid");
    avatars.forEach(name => {
        const img = document.createElement("img");
        img.src = `../images/${name}`;
        img.className = "avatar";
        img.alt = name;
        img.onclick = () => selectAvatar(img, img.src, name);
        grid.appendChild(img);
    });
}

function selectAvatar(img, avatarPath, name) {
    document.querySelectorAll(".avatar").forEach(el => el.classList.remove("selected"));
    img.classList.add("selected");
    selectedAvatar = name;
    document.getElementById("preview").innerHTML = `
    <p>Selected Avatar:</p>
    <img src="${avatarPath}" onerror="showError('Selected avatar image failed to load.')" />
    `;
    showError("");
}

document.getElementById("confirm_avatar").addEventListener("click", saveAvatar);

function saveAvatar() {
    updateUserProfile({
        avatar: selectedAvatar
    })
    .then(() => {
        window.location.href = "../guild"; // ✅ correct: redirect to guild selection page
    })
    .catch(error => {
        console.error(error);
        showError("Failed to save avatar: " + error.message);
    });
}

function showError(message) {
    document.getElementById("error").innerText = message;
}

renderAvatars();