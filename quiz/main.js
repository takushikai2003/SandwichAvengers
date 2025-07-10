import { isLogin, getUserProfile, updateUserProfile } from "../lib/firebaseCommon.js";

// ログインしていなければログイン画面に戻す
if(!(await isLogin())) {
    window.location.href = "../index.html";
}

const quizForm = document.getElementById('quizForm');
const errorEl = document.getElementById('error');

quizForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q1 = quizForm.q1.value;
    const q2 = quizForm.q2.value;
    const q3 = quizForm.q3.value;
    const q4 = quizForm.q4.value;

    const mbtiResult = q1 + q2 + q3 + q4; // e.g., "ENTP"

    try {
        // Update MBTI type in user profile document
        await updateUserProfile({
            mbtiType: mbtiResult
        });

        window.location.href = "../avatar";
    }
    catch (error) {
        console.error(error);
        errorEl.innerText = "Failed to save MBTI result: " + error.message;
    }
});