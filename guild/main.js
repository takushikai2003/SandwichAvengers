import { isLogin, getUserProfile, updateUserProfile } from "../lib/firebaseCommon.js";

// ログインしていなければログイン画面に戻す
if(!(await isLogin())) {
    window.location.href = "../index.html";
}


const guilds = ["Analyst Guild", "Diplomat Guild", "Sentinel Guild", "Explorer Guild"];
let selectedGuild = null;

function renderGuilds() {
    const grid = document.getElementById("guildGrid");
    guilds.forEach(name => {
        const div = document.createElement("div");
        div.className = "guild";
        div.innerText = name;
        div.onclick = () => selectGuild(div, name);
        grid.appendChild(div);
    });
}

function selectGuild(div, name) {
    document.querySelectorAll(".guild").forEach(el => el.classList.remove("selected"));
    div.classList.add("selected");
    selectedGuild = name;
    showError(`You selected: ${name}`);
}

document.getElementById("recommend_guild").addEventListener("click", assignRecommendedGuild);

async function assignRecommendedGuild() {
    try {
        const usrProf = await getUserProfile();
        const mbti = usrProf.mbtiType || "";
        let recommended = "Explorer Guild"; // fallback

        if (/^[IE][NS][TF][JP]$/.test(mbti)) {
            if (mbti.includes("NT")) recommended = "Analyst Guild";
            else if (mbti.includes("NF")) recommended = "Diplomat Guild";
            else if (mbti[1] === "S" && mbti[3] === "J") recommended = "Sentinel Guild";
            else recommended = "Explorer Guild";
        }

        selectedGuild = recommended;
        document.querySelectorAll(".guild").forEach(el => {
            if (el.innerText === recommended) el.classList.add("selected");
            else el.classList.remove("selected");
        });
        showError(`✅ Based on your MBTI (${mbti}), we recommend: ${recommended}`);
    }
    catch (error) {
        console.error(error);
        showError("Couldn't recommend guild: " + error.message);
    }
}

document.getElementById("confirm_guild").addEventListener("click", confirmGuild);

function confirmGuild() {
    if (!selectedGuild) return showError("Please select a guild first!");
    
    updateUserProfile({
        guild: selectedGuild
    }).then(() => {
        window.location.href = "../hub";
    }).catch(error => {
        console.error(error);
        showError("Failed to save guild: " + error.message);
    });
}

function showError(message) {
    document.getElementById("error").innerText = message;
}

renderGuilds();