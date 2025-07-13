import { config } from './config.js';
import { Player, playerSize } from './Player.js';
import { Ball, ballSize } from './Ball.js';
import { joinOrCreateRoom } from './WebRTC/WebRtcManager.js';

let room = null;


// canvas init
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = config.canvasW;
canvas.height = config.canvasH;

canvas.style.display = "block";

const player = new Player("player1", canvas.width/2-100, canvas.height/2-100, 'blue');
const opponent = new Player("player2", canvas.width/2+100, canvas.height/2+100, 'red')
const ball = new Ball();


// 時間同期系
const TICK_RATE = 60;               // simulation steps per second
const TICK_INTERVAL = 1000 / TICK_RATE; // ms between ticks

let tick = 0;                       // current simulation tick
let accumulator = 0;                // time accumulator in ms
let lastTime = performance.now();   // last frame timestamp

let keys = {}, started = false;

// --- Input buffers ---------------------------------------------------------
// Map<tick, InputState>
const localInputs  = new Map();
const remoteInputs = new Map();


const currentInput = { up:false, down:false, left:false, right:false };



export async function startSoccerGame(){
	// room1~10まで参加を試す
	for(let i = 1; i <= 10; i++) {
		const roomId = `room${i}`;
		try{
			room = await joinOrCreateRoom(roomId);
		}
		catch(err) {
			// console.error("Failed to enter room " + roomId);
		}
		
		if (room) {
			break;
		}
	}

	if(!room){
		console.error("Failed to enter any room");
		return;
	}

	console.log("Entered room:", room.roomId);

	// 相手からデータが来たら、それを入れる
	room.addEventListener("message", ev => {
		const msg = JSON.parse(ev.data);
		if (msg.type === "input") {
			// Store peer input for its exact tick
			remoteInputs.set(msg.tick, msg.input);
		}
	});

	requestAnimationFrame(gameLoop);
}


// --- Input capture ---------------------------------------------------------
window.addEventListener("keydown",  e => handleKey(e.key, true));
window.addEventListener("keyup",    e => handleKey(e.key, false));

function handleKey(key, pressed) {
	switch (key) {
		case "ArrowUp":    currentInput.up    = pressed; break;
		case "ArrowDown":  currentInput.down  = pressed; break;
		case "ArrowLeft":  currentInput.left  = pressed; break;
		case "ArrowRight": currentInput.right = pressed; break;
	}
}

function gameLoop(now) {
	const delta = now - lastTime;
	lastTime = now;
	accumulator += delta;

	// Fixed‑step simulation; consume the accumulator one tick at a time
	while (accumulator >= TICK_INTERVAL) {
		simulateTick();
		accumulator -= TICK_INTERVAL;
	}

	render();
	requestAnimationFrame(gameLoop);
}


function simulateTick() {
	// 1) Freeze current input for this tick and store it
	const thisInput = { ...currentInput };         // shallow copy
	localInputs.set(tick, thisInput);

	// 2)相手にデータを送信
	room.sendMessage(JSON.stringify({
		type:  "input",
		tick:  tick,
		input: thisInput
	}));

	// 3) Apply local input immediately (client‑side prediction)
	applyInput(player, thisInput);

	// 4) Apply opponent input if already received; otherwise keep last known
	const oppInput = remoteInputs.get(tick);
	if (oppInput) {
		applyInput(opponent, oppInput);
	} // else: opponent stays on last predicted path (could add interpolation)

	// 5) Advance simulation tick
	tick++;

	// 6) (Optional) Clean up old buffered inputs to prevent unbounded growth
	const pruneBefore = tick - 120; // keep last 2 seconds of history
	if (localInputs.size > 240) {
		localInputs.forEach((_, k) => { if (k < pruneBefore) localInputs.delete(k); });
		remoteInputs.forEach((_, k) => { if (k < pruneBefore) remoteInputs.delete(k); });
	}
}



function applyInput(entity, input) {
	const dist = entity.speed / TICK_RATE; // distance per tick in px
	if (input.up)    entity.y -= dist;
	if (input.down)  entity.y += dist;
	if (input.left)  entity.x -= dist;
	if (input.right) entity.x += dist;
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

function render() {
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

	// Opponent
	ctx.fillStyle = opponent.color;
	ctx.fillRect(opponent.x, opponent.y, playerSize, playerSize);

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