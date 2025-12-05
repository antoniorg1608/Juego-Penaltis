// ========= ELEMENTOS =========
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const savesElement = document.getElementById("saves");
const recordElement = document.getElementById("record");
const goalMsgElement = document.getElementById("goal-message");
const gameOverElement = document.getElementById("gameover-message");
const timerElement = document.getElementById("timer");
const progressBar = document.getElementById("save-progress");
const canvasWrapper = document.getElementById("canvas-wrapper");

const endOverlay = document.getElementById("end-overlay");
const finalScoreText = document.getElementById("final-score-text");
const restartBtn = document.getElementById("restart-btn");

// pantalla inicio
const startOverlay = document.getElementById("start-overlay");
const startBtn = document.getElementById("start-btn");

// botones táctiles
const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");
const btnShoot = document.getElementById("btn-shoot");

// ========= CONSTANTES =========
const MAX_SAVES = 5;
const GAME_TIME = 60;

const margin = 30;
const fieldLeft = margin;
const fieldTop = margin;
const fieldRight = canvas.width - margin;
const fieldBottom = canvas.height - margin;
const fieldWidth = fieldRight - fieldLeft;
const fieldHeight = fieldBottom - fieldTop;

const centerX = (fieldLeft + fieldRight) / 2;
const centerY = (fieldTop + fieldBottom) / 2;

// proporciones tipo campo real
const penaltyDepth = fieldHeight * (16.5 / 105);
const goalAreaDepth = fieldHeight * (5.5 / 105);
const penaltyWidth = fieldWidth * (40.3 / 68);
const goalAreaWidth = fieldWidth * (18.3 / 68);
const penaltySpotDist = fieldHeight * (11 / 105);
const arcRadius = fieldHeight * (9.15 / 105);

const penaltyX = centerX - penaltyWidth / 2;
const goalAreaX = centerX - goalAreaWidth / 2;

// portería
const goalWidth = fieldWidth * 0.45;
const goalHeight = 6;
const goalX = centerX - goalWidth / 2;
const goalY = fieldTop;

// portero
const keeperWidth = 70;
const keeperHeight = 14;
let keeperX = goalX + (goalWidth - keeperWidth) / 2;
const keeperY = goalY + goalHeight + 5;
let keeperSpeed = 2;

// pelota
let ballX = centerX;
let ballY = fieldBottom - 40;
const ballRadius = 12;
let ballSpeedY = 0;
let shooting = false;

// estado
let speedMove = 8;
let leftPressed = false;
let rightPressed = false;
let score = 0;
let saves = 0;
let isGameOver = false;
let timeLeft = GAME_TIME;
let timerInterval = null;
let highScore = 0;
let gameStarted = false;

// ========= UTILIDAD =========
function loadHighScore() {
  const stored = localStorage.getItem("penalty_highscore");
  if (stored !== null) {
    const n = parseInt(stored, 10);
    if (!isNaN(n)) highScore = n;
  }
  recordElement.textContent = "Récord: " + highScore;
}

function saveHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("penalty_highscore", String(highScore));
    recordElement.textContent = "Récord: " + highScore;
  }
}

function updateProgressBar() {
  const percent = Math.min((saves / MAX_SAVES) * 100, 100);
  progressBar.style.width = percent + "%";
}

function flashCanvas(type) {
  canvasWrapper.classList.remove("flash-goal", "flash-save");
  if (type === "goal") canvasWrapper.classList.add("flash-goal");
  if (type === "save") canvasWrapper.classList.add("flash-save");
  setTimeout(() => {
    canvasWrapper.classList.remove("flash-goal", "flash-save");
  }, 200);
}

// ========= TIMER =========
function startTimer() {
  if (timerInterval || !gameStarted) return;
  timerInterval = setInterval(() => {
    if (isGameOver) return;
    timeLeft--;
    if (timeLeft < 0) timeLeft = 0;
    timerElement.textContent = "Tiempo: " + timeLeft + "s";
    if (timeLeft <= 0) triggerGameOver("time");
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timeLeft = GAME_TIME;
  timerElement.textContent = "Tiempo: " + timeLeft + "s";
}

// ========= CONTROLES =========
document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft") leftPressed = true;
  if (e.code === "ArrowRight") rightPressed = true;
  if (e.code === "Space") shoot();
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft") leftPressed = false;
  if (e.code === "ArrowRight") rightPressed = false;
});

function addHoldControl(button, onDown, onUp) {
  if (!button) return;
  button.addEventListener("mousedown", (e) => { e.preventDefault(); onDown(); });
  button.addEventListener("mouseup",   (e) => { e.preventDefault(); onUp();   });
  button.addEventListener("mouseleave",(e) => { e.preventDefault(); onUp();   });

  button.addEventListener("touchstart",(e)=>{ e.preventDefault(); onDown(); },{passive:false});
  button.addEventListener("touchend",  (e)=>{ e.preventDefault(); onUp();   },{passive:false});
  button.addEventListener("touchcancel",(e)=>{ e.preventDefault(); onUp();  },{passive:false});
}

addHoldControl(btnLeft,  () => { leftPressed = true; }, () => { leftPressed = false; });
addHoldControl(btnRight, () => { rightPressed = true; }, () => { rightPressed = false; });

btnShoot.addEventListener("click", (e) => { e.preventDefault(); shoot(); });
btnShoot.addEventListener("touchstart", (e) => { e.preventDefault(); shoot(); }, {passive:false});

// ========= DISPARO =========
function shoot() {
  if (!gameStarted || isGameOver) return;
  if (!shooting) {
    shooting = true;
    ballSpeedY = -10;
    startTimer();
  }
}

// ========= MENSAJES =========
function showGoalMessage() {
  if (isGameOver) return;
  goalMsgElement.textContent = "GOOOOOOOOL!!!!";
  goalMsgElement.classList.add("blink");
  setTimeout(() => {
    if (!isGameOver) {
      goalMsgElement.textContent = "";
      goalMsgElement.classList.remove("blink");
    }
  }, 1200);
}

function showSaveMessage() {
  if (isGameOver) return;
  goalMsgElement.textContent = "PARADAAA!!!";
  goalMsgElement.classList.add("blink");
  setTimeout(() => {
    if (!isGameOver) {
      goalMsgElement.textContent = "";
      goalMsgElement.classList.remove("blink");
    }
  }, 800);
}

// ========= GAME OVER / RESET =========
function triggerGameOver(reason) {
  if (isGameOver) return;
  isGameOver = true;

  saveHighScore();
  clearInterval(timerInterval);
  timerInterval = null;

  gameOverElement.textContent = "GAME OVER";
  gameOverElement.classList.add("blink");

  goalMsgElement.textContent = "";
  goalMsgElement.classList.remove("blink");

  finalScoreText.textContent = "Has marcado " + score + " goles";
  endOverlay.classList.add("show");
}

function resetBall(scored) {
  shooting = false;
  ballSpeedY = 0;
  ballX = centerX;
  ballY = fieldBottom - 40;

  if (scored && !isGameOver) {
    score++;
    scoreElement.textContent = score;
    showGoalMessage();
    flashCanvas("goal");
    keeperSpeed *= 1.12;
    if (Math.abs(keeperSpeed) > 10) {
      keeperSpeed = 10 * Math.sign(keeperSpeed);
    }
  }
}

function resetGame() {
  isGameOver = false;
  score = 0;
  saves = 0;
  keeperSpeed = 2;
  scoreElement.textContent = "0";
  savesElement.textContent = "0";

  goalMsgElement.textContent = "";
  goalMsgElement.classList.remove("blink");
  gameOverElement.textContent = "";
  gameOverElement.classList.remove("blink");

  endOverlay.classList.remove("show");
  updateProgressBar();
  resetTimer();

  ballX = centerX;
  ballY = fieldBottom - 40;
  keeperX = goalX + (goalWidth - keeperWidth) / 2;
}

restartBtn.addEventListener("click", () => {
  resetGame();
});

// ========= UPDATE =========
function update() {
  if (!gameStarted || isGameOver) return;

  // movimiento balón lateral
  if (!shooting) {
    if (leftPressed)  ballX -= speedMove;
    if (rightPressed) ballX += speedMove;
  }

  // limitar a bandas
  if (ballX - ballRadius < fieldLeft) ballX = fieldLeft + ballRadius;
  if (ballX + ballRadius > fieldRight) ballX = fieldRight - ballRadius;

  // pelota en vuelo
  if (shooting) ballY += ballSpeedY;

  // portero
  keeperX += keeperSpeed;
  const kMin = goalX;
  const kMax = goalX + goalWidth - keeperWidth;
  if (keeperX <= kMin) {
    keeperX = kMin;
    keeperSpeed *= -1;
  } else if (keeperX >= kMax) {
    keeperX = kMax;
    keeperSpeed *= -1;
  }

  // zonas de gol / portero
  const inGoalX = ballX > goalX && ballX < goalX + goalWidth;
  const inGoalY = ballY - ballRadius <= goalY + goalHeight;

  const hitKeeper =
    ballX + ballRadius > keeperX &&
    ballX - ballRadius < keeperX + keeperWidth &&
    ballY - ballRadius <= keeperY + keeperHeight &&
    ballY + ballRadius >= keeperY;

  if (hitKeeper) {
    saves++;
    savesElement.textContent = saves;
    updateProgressBar();
    flashCanvas("save");
    showSaveMessage();

    if (saves >= MAX_SAVES) {
      triggerGameOver("saves");
    }
    resetBall(false);
  } else if (inGoalX && inGoalY) {
    resetBall(true);
  }

  // se va por arriba sin gol
  if (ballY + ballRadius < fieldTop) {
    resetBall(false);
  }
}

// ========= DIBUJO DEL CAMPO COMPLETO =========
function drawField() {
  ctx.strokeStyle = "white";
  ctx.fillStyle = "white";

  // líneas principales gruesas
  ctx.lineWidth = 7;

  // borde
  ctx.strokeRect(fieldLeft, fieldTop, fieldWidth, fieldHeight);

  // línea central
  ctx.beginPath();
  ctx.moveTo(fieldLeft, centerY);
  ctx.lineTo(fieldRight, centerY);
  ctx.stroke();

  // círculo central
  const centerRadius = fieldWidth * 0.18;
  ctx.beginPath();
  ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // punto central
  ctx.beginPath();
  ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
  ctx.fill();

  // áreas grandes (arriba y abajo)
  ctx.strokeRect(penaltyX, fieldTop, penaltyWidth, penaltyDepth);
  ctx.strokeRect(
    penaltyX,
    fieldBottom - penaltyDepth,
    penaltyWidth,
    penaltyDepth
  );

  // áreas pequeñas (arriba y abajo)
  ctx.strokeRect(goalAreaX, fieldTop, goalAreaWidth, goalAreaDepth);
  ctx.strokeRect(
    goalAreaX,
    fieldBottom - goalAreaDepth,
    goalAreaWidth,
    goalAreaDepth
  );

  // puntos de penalti
  const topPenaltySpotY = fieldTop + penaltySpotDist;
  const bottomPenaltySpotY = fieldBottom - penaltySpotDist;

  ctx.beginPath();
  ctx.arc(centerX, topPenaltySpotY, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, bottomPenaltySpotY, 5, 0, Math.PI * 2);
  ctx.fill();

  // semicírculos del área
  ctx.lineWidth = 5;

  ctx.beginPath();
  ctx.arc(
    centerX,
    topPenaltySpotY,
    arcRadius,
    Math.PI * 0.23,
    Math.PI * 0.77
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    centerX,
    bottomPenaltySpotY,
    arcRadius,
    -Math.PI * 0.77,
    -Math.PI * 0.23
  );
  ctx.stroke();
}

function drawGoal() {
  ctx.strokeStyle = "red";
  ctx.lineWidth = 6;
  ctx.strokeRect(goalX, goalY, goalWidth, goalHeight);
}

function drawKeeper() {
  ctx.fillStyle = "yellow";
  ctx.fillRect(keeperX, keeperY, keeperWidth, keeperHeight);
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
  ctx.stroke();
}

// ========= LOOP =========
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawField();
  drawGoal();
  drawKeeper();
  drawBall();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ========= INICIO =========
loadHighScore();
updateProgressBar();
resetTimer();
loop();

// click en EMPEZAR A JUGAR
startBtn.addEventListener("click", () => {
  gameStarted = true;
  startOverlay.style.display = "none";
  resetGame();
});
