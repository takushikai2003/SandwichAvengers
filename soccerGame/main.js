import { config } from './config.js';
import { Player, playerSize } from './Player.js';
import { Ball, ballSize } from './Ball.js';

let player, ball, keys = {}, started = false;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = config.canvasW;
canvas.height = config.canvasH;



export function startSoccerGame() {
    if (started) return;
    started = true;
    canvas.style.display = "block";

    player = new Player('player1', canvas.width/2-100, canvas.height/2-100, 'blue');
	ball = new Ball();

    document.addEventListener('keydown', e => {
		keys[e.key.toLowerCase()] = true;
		// 矢印キーも対応
		if (e.key === 'ArrowUp') keys['w'] = true;
		if (e.key === 'ArrowDown') keys['s'] = true;
		if (e.key === 'ArrowLeft') keys['a'] = true;
		if (e.key === 'ArrowRight') keys['d'] = true;
	});
    document.addEventListener('keyup', e => {
		keys[e.key.toLowerCase()] = false;
		// 矢印キーも対応
		if (e.key === 'ArrowUp') keys['w'] = false;
		if (e.key === 'ArrowDown') keys['s'] = false;
		if (e.key === 'ArrowLeft') keys['a'] = false;
		if (e.key === 'ArrowRight') keys['d'] = false;
	});

    requestAnimationFrame(gameLoop);
}

function gameLoop() {
	update();
	draw();
	requestAnimationFrame(gameLoop);
}


function update() {
	if(isGoalLeft()){
		console.log("Goal left");
	}
	if(isGoalRight()){
		console.log("Goal right");
	}

	if (keys['w']) player.y -= 4;
	if (keys['s']) player.y += 4;
	if (keys['a']) player.x -= 4;
	if (keys['d']) player.x += 4;
	// はみ出すのを防ぐ
	player.x = Math.max(0, Math.min(canvas.width - playerSize/2, player.x));
	player.y = Math.max(0, Math.min(canvas.height - playerSize/2, player.y));

	// Ball movement
	if(isCollision(player.x + playerSize / 2, player.y + playerSize / 2, playerSize / 2, ball.x + ballSize / 2, ball.y + ballSize / 2, ballSize / 2)) {
		const ballCenterX = ball.x + ballSize / 2;
		const ballCenterY = ball.y + ballSize / 2;
		const playerCenterX = player.x + playerSize / 2;
		const playerCenterY = player.y + playerSize / 2;

		const dx = ballCenterX - playerCenterX;
		const dy = ballCenterY - playerCenterY;
		const angle = Math.atan2(dy, dx);

		ball.x += Math.cos(angle) * 5; // Move the ball in the direction of the player
		ball.y += Math.sin(angle) * 5;

		// はみ出すのを防ぐ
		ball.x = Math.max(0, Math.min(canvas.width - ballSize, ball.x));
		ball.y = Math.max(0, Math.min(canvas.height - ballSize, ball.y));
	}
}

function draw() {
	ctx.fillStyle = '#0b7a1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Field center line
	ctx.strokeStyle = 'white'; ctx.lineWidth=2;
	ctx.beginPath(); ctx.moveTo(canvas.width/2,0); ctx.lineTo(canvas.width/2,canvas.height); ctx.stroke();
	
	// Goal areas
	ctx.fillStyle='yellow';
	ctx.fillRect(0, canvas.height/2-50, 5, 100);
	ctx.fillRect(canvas.width-5, canvas.height/2-50, 5, 100);


	// Player
	ctx.fillStyle = player.color;
	ctx.fillRect(player.x, player.y, playerSize, playerSize);

	// Ball
	ctx.fillStyle = 'white';
	ctx.beginPath();
	ctx.arc(ball.x + ballSize / 2, ball.y + ballSize / 2, ballSize / 2, 0, Math.PI * 2);
	ctx.fill();
	ctx.closePath();
	ctx.strokeStyle = 'black';
	ctx.lineWidth = 2;
	ctx.stroke();
}


// 2つの円の衝突判定
function isCollision(x1, y1, r1, x2, y2, r2) {
	const dx = x1 - x2;
	const dy = y1 - y2;
	const distance = Math.sqrt(dx * dx + dy * dy);
	return distance < (r1 + r2);
}

function isGoalLeft() {
	return (
		ball.x <= 0 &&
		ball.y + ballSize >= canvas.height / 2 - 50 &&
		ball.y  <= canvas.height / 2 + 50
	);
}

function isGoalRight() {
	return (
		ball.x + ballSize >= canvas.width &&
		ball.y + ballSize >= canvas.height / 2 - 50 &&
		ball.y  <= canvas.height / 2 + 50
	);
}