import { firebaseConfig } from '../env/firebaseCommon.js';

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const avatars = ["warrior.png", "mage.png", "healer.png", "rogue.png"];
let selectedAvatar = null;
let currentUid = null;

function renderAvatars() {
    const grid = document.getElementById("avatarGrid");
    avatars.forEach(name => {
        const img = document.createElement("img");
        img.src = `../images/${name}`;
        img.className = "avatar";
        img.alt = name;
        img.onclick = () => selectAvatar(img, img.src);
        grid.appendChild(img);
    });
}

function selectAvatar(img, avatarPath) {
    document.querySelectorAll(".avatar").forEach(el => el.classList.remove("selected"));
    img.classList.add("selected");
    selectedAvatar = avatarPath;
    document.getElementById("preview").innerHTML = `
    <p>Selected Avatar:</p>
    <img src="${avatarPath}" onerror="showError('Selected avatar image failed to load.')" />
    `;
    showError("");
}

document.getElementById("confirm_avatar").addEventListener("click", saveAvatar);

function saveAvatar() {
    if (!selectedAvatar || !currentUid) return showError("Please select or paste an avatar URL first.");
    db.collection("users").doc(currentUid).update({
        avatar: selectedAvatar
    })
    .then(() => {
        window.location.href = "guild.html"; // ✅ correct: redirect to guild selection page
    })
    .catch(error => {
        console.error(error);
        showError("Failed to save avatar: " + error.message);
    });
}

function showError(message) {
    document.getElementById("error").innerText = message;
}

auth.onAuthStateChanged(user => {
    if (!user) window.location.href = "index.html";
    else currentUid = user.uid;
});

renderAvatars();