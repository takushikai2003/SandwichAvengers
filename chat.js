const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");

function sendChat() {
  const text = chatInput.value.trim();
  if (!text || !auth.currentUser) return;

  db.collection("users").doc(auth.currentUser.uid).get().then(doc => {
    const username = doc.data().username || "Unknown";
    const guild = doc.data().guild || "General";
    db.collection("guildChats").doc(guild).collection("messages").add({
      username,
      text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    chatInput.value = "";
  });
}

auth.onAuthStateChanged(user => {
  if (!user) return;
  db.collection("users").doc(user.uid).get().then(doc => {
    const guild = doc.data().guild || "General";
    db.collection("guildChats").doc(guild).collection("messages")
      .orderBy("timestamp", "asc")
      .onSnapshot(snapshot => {
        chatLog.innerHTML = "";
        snapshot.forEach(doc => {
          const msg = doc.data();
          const time = msg.timestamp?.toDate().toLocaleTimeString() || "unknown time";
          chatLog.innerHTML += `<p><strong>${msg.username}</strong> [${time}]: ${msg.text}</p>`;
        });
        chatLog.scrollTop = chatLog.scrollHeight;
      });
  });
});
