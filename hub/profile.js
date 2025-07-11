auth.onAuthStateChanged(user => {
  if (!user) window.location.href = "index.html";
  else loadProfile(user.uid);
});

function loadProfile(uid) {
  db.collection("users").doc(uid).onSnapshot(doc => {
    const data = doc.data();
    document.getElementById("profileUsername").innerText = data.username || "Unknown";
    document.getElementById("profileMBTI").innerText = data.mbtiType || "---";
    document.getElementById("profileGuild").innerText = data.guild || "---";
    document.getElementById("profileAvatar").src = data.avatar || "../images/default.png";
    document.getElementById("profileActivities").innerText = "Coming soon!";
  });
}
