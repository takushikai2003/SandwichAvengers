const boardDiv = document.getElementById("boardPosts");
const boardInput = document.getElementById("boardInput");

export function postBoardMessage() {
  const text = boardInput.value.trim();
  if (!text || !auth.currentUser) return;

  const userId = auth.currentUser.uid;
  db.collection("users").doc(userId).get().then(doc => {
    const user = doc.data();
    const username = user.username || "Unknown";
    const guild = user.guild || "General";
    db.collection("guildBoards").doc(guild).collection("posts").add({
      username,
      text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    boardInput.value = "";
  });
}

auth.onAuthStateChanged(user => {
  if (!user) return;
  db.collection("users").doc(user.uid).get().then(doc => {
    const guild = doc.data().guild || "General";
    db.collection("guildBoards").doc(guild).collection("posts")
      .orderBy("timestamp", "desc").limit(50)
      .onSnapshot(snapshot => {
        boardDiv.innerHTML = "";
        snapshot.forEach(doc => {
          const post = doc.data();
          const time = post.timestamp?.toDate().toLocaleString() || "unknown time";
          boardDiv.innerHTML += `<p><strong>${post.username}</strong> (${time}): ${post.text}</p>`;
        });
      });
  });
});
