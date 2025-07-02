function consultAdvisor() {
  const question = document.getElementById("advisorInput").value.trim();
  if (!question) return;

  document.getElementById("advisorReply").innerText = "Thinking...";

  auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    const docRef = db.collection("users").doc(user.uid);
    const data = (await docRef.get()).data();
    const username = data.username || "Guest";

    // For now, provide a canned response (later you could add an OpenAI call)
    const answer = `Hi ${username}, great question! Reflect on "${question}" and discuss it with your guild.`;

    document.getElementById("advisorReply").innerText = answer;

    // Save to advisor logs
    await db.collection("advisorLogs").add({
      userId: user.uid,
      username,
      question,
      answer,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
}
