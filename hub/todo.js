auth.onAuthStateChanged(user => {
  if (!user) return;
  db.collection("users").doc(user.uid).get().then(doc => {
    const mbti = doc.data().mbtiType || "";
    const isPType = mbti.endsWith("P");
    document.getElementById("todoInstructions").innerText = isPType
      ? "You're a P type! Enjoy your playful bubble-style tasks below."
      : "You're a J type! Organize your tasks in an ordered checklist below.";
    document.getElementById("j-list").style.display = isPType ? "none" : "block";
    document.getElementById("p-container").style.display = isPType ? "block" : "none";
  });
});

document.getElementById('todo-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  if (!text) return;

  db.collection("users").doc(auth.currentUser.uid).get().then(doc => {
    const mbti = doc.data().mbtiType || "";
    const isPType = mbti.endsWith("P");
    if (isPType) createBubble(text);
    else addJListItem(text);
    input.value = '';
  });
});

function addJListItem(text) {
  const list = document.getElementById('j-list');
  const li = document.createElement('li');
  li.innerHTML = `${text} <button onclick="this.parentElement.remove()">×</button>`;
  list.appendChild(li);
}

function createBubble(text) {
  const container = document.getElementById('p-container');
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = `${text} <button onclick="this.parentElement.remove()">×</button>`;

  const bubbleWidth = 120, bubbleHeight = 120;
  const maxX = container.clientWidth - bubbleWidth;
  const maxY = container.clientHeight - bubbleHeight;
  let placed = false, attempt = 0, maxAttempts = 100;

  while (!placed && attempt < maxAttempts) {
    const left = Math.random() * maxX;
    const top = Math.random() * maxY;
    const existingBubbles = container.getElementsByClassName('bubble');
    let overlap = false;

    for (let other of existingBubbles) {
      const dx = left - parseFloat(other.style.left || 0);
      const dy = top - parseFloat(other.style.top || 0);
      const distance = Math.hypot(dx, dy);
      if (distance < bubbleWidth * 0.9) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      bubble.style.left = `${left}px`;
      bubble.style.top = `${top}px`;
      placed = true;
    }
    attempt++;
  }

  container.appendChild(bubble);
}
