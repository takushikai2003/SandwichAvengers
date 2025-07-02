let canvas, ctx, player, keys = {}, started = false;

function startSoccerGame() {
  if (started) return; started = true;

  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  canvas.style.display = "block";

  player = { x: canvas.width/2-20, y: canvas.height/2-20 };

  document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function update() {
  if (keys['w']) player.y -= 4;
  if (keys['s']) player.y += 4;
  if (keys['a']) player.x -= 4;
  if (keys['d']) player.x += 4;
  player.x = Math.max(0, Math.min(canvas.width-20, player.x));
  player.y = Math.max(0, Math.min(canvas.height-20, player.y));
}

function draw() {
  ctx.fillStyle = '#0b7a1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Field center line & goals
  ctx.strokeStyle = 'white'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(canvas.width/2,0); ctx.lineTo(canvas.width/2,canvas.height); ctx.stroke();
  ctx.fillStyle='yellow';
  ctx.fillRect(0, canvas.height/2-50,5,100);
  ctx.fillRect(canvas.width-5, canvas.height/2-50,5,100);

  // Player
    ctx.fillStyle = 'blue'; ctx.fillRect(player.x, player.y, 40, 40);
  }
