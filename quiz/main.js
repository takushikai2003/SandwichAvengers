import { firebaseConfig } from "../env/firebaseCommon.js";

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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
    const user = auth.currentUser;
    if (!user) {
        errorEl.innerText = "Not logged in. Please log in again.";
        return;
    }

    // Update MBTI type in user profile document
    await db.collection("users").doc(user.uid).update({
        mbtiType: mbtiResult
    });

    window.location.href = "avatar.html";
    } catch (error) {
    console.error(error);
    errorEl.innerText = "Failed to save MBTI result: " + error.message;
    }
});

// Optional: check guest expiration (re-use the function from auth page)
async function checkGuestExpiration() {
    const user = auth.currentUser;
    if (!user) return;
    const userDoc = await db.collection("users").doc(user.uid).get();
    const data = userDoc.data();
    if (data.expiresAt && new Date() > data.expiresAt.toDate()) {
    await auth.signOut();
    alert("Your guest session has expired. Please sign up to continue!");
    window.location.href = "index.html";
    }
}

auth.onAuthStateChanged((user) => {
    if (user) checkGuestExpiration();
    else window.location.href = "index.html"; // if not logged in, redirect to login
});
