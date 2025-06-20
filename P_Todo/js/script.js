// バブル作成関数
function createBubble(text) {
  const container = document.getElementById('todo-container');

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = `${text} <button onclick="this.parentElement.remove()">×</button>`;

  container.appendChild(bubble);

  const bubbleWidth = bubble.offsetWidth;
  const bubbleHeight = bubble.offsetHeight;

  const maxX = window.innerWidth  - bubbleWidth;
  const maxY = window.innerHeight - bubbleHeight;

  let placed = false;
  let attempt = 0;
  const maxAttempts = 100;

  while (!placed && attempt < maxAttempts) {
    const left = Math.random() * maxX;
    const top  = Math.random() * maxY;

    const existingBubbles = container.getElementsByClassName('bubble');
    let overlap = false;

    for (let i = 0; i < existingBubbles.length - 1; i++) {
      const other = existingBubbles[i];
      const otherLeft = parseFloat(other.style.left);
      const otherTop  = parseFloat(other.style.top);

      const dx = left - otherLeft;
      const dy = top  - otherTop;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < bubbleWidth * 0.9) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      bubble.style.left = `${left}px`;
      bubble.style.top  = `${top}px`;
      placed = true;
    }
    attempt++;
  }
}

// フォーム送信時の処理
document.getElementById('todo-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  if (!text) return;

  createBubble(text);

  input.value = '';
});

