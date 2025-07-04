// rpg.js — Maze-Style MBTI Guild Room
let canvas, ctx, miniCanvas, miniCtx;
let currentPlayer = null;
let players = {};
let lastDialogue = {};
const gridSize = 40;
const canvasWidth = 800;
const canvasHeight = 400;
const scale = 0.1;
const blockedTiles = new Set();

const tileMap = [
  "🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱",
  "🧱⬜⬜⬜⬜🧱⬜⬜⬜⬜⬜🧱⬜⬜⬜⬜⬜⬜⬜🧱",
  "🧱⬜🧱🧱⬜🧱⬜🧱🧱🧱⬜🧱⬜🧱🧱🧱⬜🧱⬜🧱",
  "🧱⬜🧱⬜⬜⬜⬜🧱⬜⬜⬜⬜🧱⬜⬜⬜⬜🧱⬜🧱",
  "🧱⬜🧱⬜🧱🧱🧱🧱⬜🧱🧱🧱🧱⬜🧱🧱⬜🧱⬜🧱",
  "🧱⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜🧱",
  "🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱"
];

const furnitures = [
  { emoji: "🪑", x: 160, y: 160 },
  { emoji: "📚", x: 280, y: 200 },
  { emoji: "🛏️", x: 480, y: 280 },
  { emoji: "🪞", x: 600, y: 120 },
  { emoji: "🧙‍♂️", x: 680, y: 200 }
];

function initializeRPGRoom(userId, userName, guild, db) {
  canvas = document.getElementById("rpgCanvas");
  ctx = canvas.getContext("2d");

  miniCanvas = document.createElement("canvas");
  miniCanvas.width = canvasWidth * scale;
  miniCanvas.height = canvasHeight * scale;
  miniCanvas.style.position = "absolute";
  miniCanvas.style.right = "20px";
  miniCanvas.style.bottom = "20px";
  miniCanvas.style.border = "2px solid #333";
  document.body.appendChild(miniCanvas);
  miniCtx = miniCanvas.getContext("2d");

  currentPlayer = {
    id: userId,
    name: userName,
    x: 80,
    y: 80,
    avatar: "https://i.imgur.com/YzPXRsu.png",
    mbti: ""
  };

  db.collection("users").doc(userId).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      if (data.avatar) currentPlayer.avatar = data.avatar;
      if (data.mbti) currentPlayer.mbti = data.mbti;
    }
  });

  db.collection("rooms").doc(guild).collection("players").onSnapshot(snapshot => {
    players = {};
    snapshot.forEach(doc => {
      players[doc.id] = doc.data();
    });
  });

  setInterval(() => {
    db.collection("rooms").doc(guild).collection("players").doc(userId).set(currentPlayer);
  }, 1500);

  requestAnimationFrame(drawScene);
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  blockedTiles.clear();

  tileMap.forEach((row, rowIndex) => {
    [...row].forEach((tile, colIndex) => {
      const x = colIndex * gridSize;
      const y = rowIndex * gridSize;
      ctx.font = "28px serif";
      ctx.fillText(tile, x + 5, y + 30);
      if (tile === "🧱") blockedTiles.add(`${x},${y}`);
    });
  });

  furnitures.forEach(f => {
    ctx.font = "28px serif";
    ctx.fillText(f.emoji, f.x, f.y);
    blockedTiles.add(`${Math.floor(f.x / gridSize) * gridSize},${Math.floor(f.y / gridSize) * gridSize}`);
  });

  for (const id in players) {
    const p = players[id];
    const img = new Image();
    img.src = p.avatar || "images/default.png";
    img.onload = () => {
      ctx.drawImage(img, p.x, p.y, 32, 32);
      ctx.font = "12px Arial";
      ctx.fillStyle = "#111";
      ctx.textAlign = "center";
      ctx.fillText(p.name, p.x + 16, p.y - 8);
      if (p.mbti) ctx.fillText(p.mbti, p.x + 16, p.y + 44);
      if (lastDialogue[id]) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(p.x - 10, p.y - 30, 100, 20);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(p.x - 10, p.y - 30, 100, 20);
        ctx.fillStyle = "#000";
        ctx.font = "10px Arial";
        ctx.fillText(lastDialogue[id], p.x + 40, p.y - 15);
      }
    };
  }

  // Draw current player
  const img = new Image();
  img.src = currentPlayer.avatar;
  img.onload = () => {
    ctx.drawImage(img, currentPlayer.x, currentPlayer.y, 32, 32);
    ctx.font = "12px Arial";
    ctx.fillStyle = "#111";
    ctx.textAlign = "center";
    ctx.fillText(currentPlayer.name, currentPlayer.x + 16, currentPlayer.y - 8);
    if (currentPlayer.mbti) ctx.fillText(currentPlayer.mbti, currentPlayer.x + 16, currentPlayer.y + 44);
    if (lastDialogue[currentPlayer.id]) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(currentPlayer.x - 10, currentPlayer.y - 30, 100, 20);
      ctx.strokeStyle = "#000";
      ctx.strokeRect(currentPlayer.x - 10, currentPlayer.y - 30, 100, 20);
      ctx.fillStyle = "#000";
      ctx.font = "10px Arial";
      ctx.fillText(lastDialogue[currentPlayer.id], currentPlayer.x + 40, currentPlayer.y - 15);
    }
  };

  drawMiniMap();
  requestAnimationFrame(drawScene);
}

function drawMiniMap() {
  miniCtx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);
  miniCtx.fillStyle = "#eee";
  miniCtx.fillRect(0, 0, miniCanvas.width, miniCanvas.height);

  miniCtx.fillStyle = "#000";
  tileMap.forEach((row, r) => {
    [...row].forEach((tile, c) => {
      if (tile === "🧱") {
        miniCtx.fillRect(c * gridSize * scale, r * gridSize * scale, gridSize * scale, gridSize * scale);
      }
    });
  });

  miniCtx.fillStyle = "green";
  furnitures.forEach(f => {
    miniCtx.fillRect(f.x * scale, f.y * scale, 4, 4);
  });

  miniCtx.fillStyle = "blue";
  miniCtx.fillRect(currentPlayer.x * scale, currentPlayer.y * scale, 4, 4);
}

window.addEventListener("keydown", e => {
  if (!currentPlayer) return;
  const step = gridSize;
  let nextX = currentPlayer.x;
  let nextY = currentPlayer.y;

  switch (e.key.toLowerCase()) {
    case "w": case "arrowup": nextY -= step; break;
    case "s": case "arrowdown": nextY += step; break;
    case "a": case "arrowleft": nextX -= step; break;
    case "d": case "arrowright": nextX += step; break;
  }

  const nextTile = `${nextX},${nextY}`;
  if (!blockedTiles.has(nextTile)) {
    currentPlayer.x = nextX;
    currentPlayer.y = nextY;
  }
});

canvas?.addEventListener("click", e => {
  const x = e.offsetX;
  const y = e.offsetY;
  let found = false;

  for (const id in players) {
    const p = players[id];
    if (Math.abs(x - p.x) < 30 && Math.abs(y - p.y) < 30) {
      const msg = prompt(`Say something to ${p.name}:`, "Hi there! 👋");
      if (msg) {
        lastDialogue[id] = msg;
        setTimeout(() => delete lastDialogue[id], 5000);
      }
      found = true;
      break;
    }
  }

  if (!found) {
    furnitures.forEach(f => {
      if (Math.abs(x - f.x) < 25 && Math.abs(y - f.y) < 25) {
        alert(`🗨️ You interacted with ${f.emoji}`);
      }
    });
  }
});
