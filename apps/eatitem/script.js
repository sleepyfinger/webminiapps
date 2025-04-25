const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const timeElement = document.getElementById("time");
const gameOverElement = document.getElementById("gameOver");
const finalScoreElement = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");

const canvasSize = 540;
const playerSize = 35;
const itemSize = 30;
const playerSpeed = 5;
const gameTimeLimit = 60;

let player = {
  x: canvasSize / 2 - playerSize / 2,
  y: canvasSize / 2 - playerSize / 2,
};
let item = { x: 0, y: 0 };
let score = 0;
let timeLeft = gameTimeLimit;
let gameInterval = null;
let timerInterval = null;
let isGameOver = false;

const playerEmoji = "😀";
const itemEmoji = "🍎";

const joystickBaseRadius = 50;
const joystickKnobRadius = 25;
const joystickBaseColor = "rgba(128, 128, 128, 0.5)";
const joystickKnobColor = "rgba(80, 80, 80, 0.7)";

let isDragging = false;
let joystickBaseX = 0;
let joystickBaseY = 0;
let joystickKnobX = 0;
let joystickKnobY = 0;
let touchIdentifier = null;

function generateItemPosition() {
  const margin = itemSize;
  let newItemX, newItemY, dx, dy, distance;
  const minDistance = playerSize * 1.5;
  const playerCenterX = player.x + playerSize / 2;
  const playerCenterY = player.y + playerSize / 2;

  do {
    newItemX = Math.random() * (canvasSize - margin * 2) + margin;
    newItemY = Math.random() * (canvasSize - margin * 2) + margin;
    dx = playerCenterX - newItemX;
    dy = playerCenterY - newItemY;
    distance = Math.sqrt(dx * dx + dy * dy);
  } while (distance < minDistance);

  item.x = newItemX;
  item.y = newItemY;
}

function drawPlayer() {
  ctx.font = `${playerSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const centerX = player.x + playerSize / 2;
  const centerY = player.y + playerSize / 2;
  ctx.fillText(playerEmoji, centerX, centerY);
}

function drawItem() {
  ctx.font = `${itemSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(itemEmoji, item.x, item.y);
}

function drawJoystick() {
  if (!isDragging) return;

  ctx.beginPath();
  ctx.arc(joystickBaseX, joystickBaseY, joystickBaseRadius, 0, Math.PI * 2);
  ctx.fillStyle = joystickBaseColor;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(joystickKnobX, joystickKnobY, joystickKnobRadius, 0, Math.PI * 2);
  ctx.fillStyle = joystickKnobColor;
  ctx.fill();
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvasSize, canvasSize);
}

function updateUI() {
  scoreElement.textContent = score;
  timeElement.textContent = timeLeft;
}

function checkCollision() {
  const playerCenterX = player.x + playerSize / 2;
  const playerCenterY = player.y + playerSize / 2;
  const dx = playerCenterX - item.x;
  const dy = playerCenterY - item.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const collisionDistance = (playerSize + itemSize) / 2;
  return distance < collisionDistance * 0.8;
}

function updatePlayerPosition() {
  if (!isDragging || isGameOver) return;

  const dx = joystickKnobX - joystickBaseX;
  const dy = joystickKnobY - joystickBaseY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > 0) {
    const moveX = (dx / distance) * playerSpeed;
    const moveY = (dy / distance) * playerSpeed;

    player.x += moveX;
    player.y += moveY;

    player.x = Math.max(0, Math.min(player.x, canvasSize - playerSize));
    player.y = Math.max(0, Math.min(player.y, canvasSize - playerSize));
  }
}

function gameLoop() {
  if (isGameOver) return;

  clearCanvas();
  updatePlayerPosition();
  drawPlayer();
  drawItem();
  drawJoystick();

  if (checkCollision()) {
    score++;
    updateUI();
    generateItemPosition();
  }
}

function updateTimer() {
  timeLeft--;
  updateUI();

  if (timeLeft <= 0) {
    endGame();
  }
}

function endGame() {
  isGameOver = true;
  if (isDragging) {
    isDragging = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    touchIdentifier = null;
  }
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  gameInterval = null;
  timerInterval = null;

  finalScoreElement.textContent = score;
  gameOverElement.classList.remove("hidden");
}

function startGame() {
  isGameOver = false;
  isDragging = false;
  touchIdentifier = null;
  score = 0;
  timeLeft = gameTimeLimit;
  player.x = canvasSize / 2 - playerSize / 2;
  player.y = canvasSize / 2 - playerSize / 2;

  gameOverElement.classList.add("hidden");

  generateItemPosition();
  updateUI();

  clearInterval(gameInterval);
  clearInterval(timerInterval);

  gameInterval = setInterval(gameLoop, 1000 / 60);
  timerInterval = setInterval(updateTimer, 1000);
}

function getCanvasCoordinates(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function handleDragStart(clientX, clientY) {
  if (isGameOver || isDragging) return;

  isDragging = true;
  const coords = getCanvasCoordinates(clientX, clientY);

  joystickBaseX = coords.x;
  joystickBaseY = coords.y;
  joystickKnobX = coords.x;
  joystickKnobY = coords.y;
}

function handleDragMove(clientX, clientY) {
  if (!isDragging || isGameOver) return;

  const coords = getCanvasCoordinates(clientX, clientY);
  const currentX = coords.x;
  const currentY = coords.y;

  const dx = currentX - joystickBaseX;
  const dy = currentY - joystickBaseY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < joystickBaseRadius) {
    joystickKnobX = currentX;
    joystickKnobY = currentY;
  } else {
    joystickKnobX = joystickBaseX + (dx / distance) * joystickBaseRadius;
    joystickKnobY = joystickBaseY + (dy / distance) * joystickBaseRadius;
  }
}

function handleDragEnd() {
  if (!isDragging) return;
  isDragging = false;
}

function handleMouseMove(event) {
  if (!isDragging || isGameOver) return;
  event.preventDefault();
  handleDragMove(event.clientX, event.clientY);
}

function handleMouseUp(event) {
  if (!isDragging || isGameOver) return;
  event.preventDefault();
  handleDragEnd();
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
}

canvas.addEventListener("mousedown", (event) => {
  if ((isDragging && touchIdentifier !== null) || isGameOver) return;

  event.preventDefault();
  handleDragStart(event.clientX, event.clientY);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
});

function handleTouchEndCancel(event) {
  if (!isDragging || isGameOver) return;
  const touch = Array.from(event.changedTouches).find(
    (t) => t.identifier === touchIdentifier
  );
  if (!touch) return;

  event.preventDefault();
  handleDragEnd();
  touchIdentifier = null;
}

canvas.addEventListener(
  "touchstart",
  (event) => {
    if (isDragging || touchIdentifier !== null || isGameOver) return;

    event.preventDefault();
    const touch = event.changedTouches[0];
    touchIdentifier = touch.identifier;
    handleDragStart(touch.clientX, touch.clientY);
  },
  { passive: false }
);

canvas.addEventListener(
  "touchmove",
  (event) => {
    if (!isDragging || isGameOver) return;
    const touch = Array.from(event.changedTouches).find(
      (t) => t.identifier === touchIdentifier
    );
    if (!touch) return;

    event.preventDefault();
    handleDragMove(touch.clientX, touch.clientY);
  },
  { passive: false }
);

canvas.addEventListener("touchend", handleTouchEndCancel, { passive: false });
canvas.addEventListener("touchcancel", handleTouchEndCancel, {
  passive: false,
});

restartButton.addEventListener("click", startGame);

startGame();
