document.getElementById('todo-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  if (!text) return;

  const container = document.getElementById('todo-container');

  // 1. 新しいバブルを作成
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = `${text} <button onclick="this.parentElement.remove()">×</button>`;

  container.appendChild(bubble); // サイズ測定のため先に追加

  const bubbleWidth = bubble.offsetWidth;
  const bubbleHeight = bubble.offsetHeight;

  const existingBubbles = container.getElementsByClassName('bubble');
  let placed = false;
  let attempt = 0;
  const maxAttempts = 100;

  // 2. ランダム配置＆重なりチェック
  while (!placed && attempt < maxAttempts) {
    const maxX = window.innerWidth  - bubble.offsetWidth;
    const maxY = window.innerHeight - bubble.offsetHeight;

    const left = Math.random() * maxX -100;
    const top  = Math.random() * maxY -100;

    let overlap = false;
    for (let i = 0; i < existingBubbles.length - 1; i++) {
      const other = existingBubbles[i];
      const otherLeft = parseFloat(other.style.left);
      const otherTop  = parseFloat(other.style.top);

      const dx = left - otherLeft;
      const dy = top  - otherTop;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // バブルの中心間距離が直径より小さいなら重なり
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

  // 3. 入力クリア
  input.value = '';
});
