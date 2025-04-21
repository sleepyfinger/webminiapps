const GRID_SIZE = 6;
const CELL_SIZE = 60;
const INITIAL_TIME = 60;
const WINDOW_WIDTH = GRID_SIZE * CELL_SIZE;
const WINDOW_HEIGHT = GRID_SIZE * CELL_SIZE;

const COLOR_CELL_BG = "rgba(228, 228, 228,";
const COLOR_CELL_BORDER = "rgba(128, 128, 128,";
const COLOR_TEXT = "rgba(80, 80, 80, 1)";
const COLOR_CELL_SELECTED = "rgba(0, 123, 255, 0.3)";
const COLOR_LINE = "rgba(0, 123, 255, 0.7)";

const numberWeights = {
  1: 20,
  2: 20,
  3: 15,
  4: 15,
  5: 10,
  6: 10,
  7: 5,
  8: 3,
  9: 2,
};

let grid = [];
let selectedCells = [];
let score = 0;
let highScore = 0;
let isDragging = false;
let currentX = 0;
let currentY = 0;
let timeLeft = INITIAL_TIME;
let gameOver = false;
let gameStarted = false;
let cellFont;
let scoreSound;
let resetButton;
let restartButtonHtml;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const currentScoreSpan = document.getElementById("currentScore");
const highScoreSpan = document.getElementById("highScore");
const gameGaugeFill = document.getElementById("gameGaugeFill");

const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreValueSpan = document.getElementById("finalScoreValue");
const gameOverHighScoreValueSpan = document.getElementById(
  "gameOverHighScoreValue"
);

canvas.width = WINDOW_WIDTH;
canvas.height = WINDOW_HEIGHT;

let fallingCells = [];

let deferredPrompt;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
});

const installApp = () => {
  if (!deferredPrompt) {
    alert("앱을 설치할 수 없는 환경입니다");
    return;
  }
  deferredPrompt.prompt();
};

function init() {
  scoreSound = document.getElementById("scoreSound");
  resetButton = document.getElementById("resetButton");
  restartButtonHtml = document.getElementById("restartButtonHtml");

  const bodyFont = window.getComputedStyle(document.body).fontFamily;

  cellFont = `20px ${bodyFont}`;

  highScore = localStorage.getItem("tenline.highScore") || 0;
  highScoreSpan.textContent = highScore;

  resetGame();

  setupEventListeners();

  gameLoop();
}

function setupTouchEventListeners() {
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvas.addEventListener("touchend", handleTouchEnd);
}

function handleTouchStart(event) {
  event.preventDefault();
  if (gameOver) return;
  const touch = event.touches[0];
  const { x, y } = getTouchPosition(touch);
  const cell = getGridPosition(x, y);

  if (cell) {
    startSelection(cell.gridX, cell.gridY, x, y);
  }
}

function handleTouchMove(event) {
  event.preventDefault();
  if (!isDragging || gameOver) return;
  const touch = event.touches[0];
  const { x, y } = getTouchPosition(touch);
  const cell = getGridPosition(x, y);

  if (cell) {
    continueSelection(cell.gridX, cell.gridY, x, y);
  } else {
    updateCurrentMousePosition(x, y);
  }
}

function handleTouchEnd(event) {
  if (!isDragging) return;
  endSelection();
}

function getTouchPosition(touch) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (touch.clientX - rect.left) * scaleX;
  const y = (touch.clientY - rect.top) * scaleY;
  return { x, y };
}

function setupEventListeners() {
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  resetButton.addEventListener("click", resetGame);
  restartButtonHtml.addEventListener("click", resetGame);

  setupTouchEventListeners();
}

function handleMouseDown(event) {
  if (gameOver) return;
  const { x, y } = getMousePosition(event);
  const cell = getGridPosition(x, y);

  if (cell) {
    startSelection(cell.gridX, cell.gridY, x, y);
  }
}

function handleMouseMove(event) {
  if (!isDragging || gameOver) return;
  const { x, y } = getMousePosition(event);
  const cell = getGridPosition(x, y);

  if (cell) {
    continueSelection(cell.gridX, cell.gridY, x, y);
  } else {
    updateCurrentMousePosition(x, y);
  }
}

function handleMouseUp(event) {
  if (!isDragging) return;
  endSelection();
}

function getMousePosition(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  return { x, y };
}

function update(dt) {
  if (!gameOver && gameStarted) {
    updateTime(dt);
  }
  updateFallingCells(dt);
}

function updateTime(dt) {
  timeLeft = Math.max(0, timeLeft - dt);

  const timeRatio = timeLeft / INITIAL_TIME;
  const gaugeWidthPercentage = Math.max(0, timeRatio * 100);
  gameGaugeFill.style.width = `${gaugeWidthPercentage}%`;

  if (timeLeft <= 0) {
    endGame();
  }
}

function draw() {
  clearCanvas();

  drawGrid();
  updateFallingCells();

  if (!gameOver) {
    drawSelectedCells();
    drawLine();
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  for (let y = 1; y <= GRID_SIZE; y++) {
    for (let x = 1; x <= GRID_SIZE; x++) {
      if (grid[y] && grid[y][x]) {
        drawCell(x, y);
      }
    }
  }
}

function drawCell(x, y) {
  const cellData = grid[y][x];
  if (!cellData) return;

  const centerX = (x - 0.5) * CELL_SIZE;
  const centerY = (y - 0.5) * CELL_SIZE;
  const radius = CELL_SIZE * 0.45;

  if (cellData.alpha < 1) {
    cellData.alpha += cellData.fadeSpeed;
    cellData.alpha = Math.min(1, cellData.alpha);
  }

  const force = cellData.targetScale - cellData.scale;
  const acceleration = force * cellData.scaleSpring;
  cellData.scaleVelocity += acceleration;
  cellData.scaleVelocity *= 1 - cellData.scaleFriction;
  cellData.scale += cellData.scaleVelocity;

  const currentScale = Math.max(0, cellData.scale);
  const currentRadius = radius * currentScale;

  ctx.save();

  ctx.globalAlpha = cellData.alpha;

  ctx.fillStyle = "#f5f5f5";
  ctx.beginPath();
  ctx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI);
  ctx.fill();

  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI);
  ctx.stroke();

  if (cellData.number > 0 && currentRadius > 5) {
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = cellFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = cellData.number.toString();
    ctx.fillText(text, centerX, centerY + 1);
  }

  ctx.restore();
}

function drawSelectedCells() {
  ctx.fillStyle = COLOR_CELL_SELECTED;
  selectedCells.forEach((cell) => {
    const centerX = (cell.x - 0.5) * CELL_SIZE;
    const centerY = (cell.y - 0.5) * CELL_SIZE;
    const radius = CELL_SIZE * 0.45;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
  });
}

function drawLine() {
  if (selectedCells.length > 1) {
    ctx.strokeStyle = COLOR_LINE;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    const firstCell = selectedCells[0];
    ctx.moveTo(
      (firstCell.x - 0.5) * CELL_SIZE,
      (firstCell.y - 0.5) * CELL_SIZE
    );

    for (let i = 1; i < selectedCells.length; i++) {
      const cell = selectedCells[i];
      ctx.lineTo((cell.x - 0.5) * CELL_SIZE, (cell.y - 0.5) * CELL_SIZE);
    }

    if (isDragging) {
      ctx.lineTo(currentX, currentY);
    }

    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
  }
}

function startSelection(gridX, gridY, mouseX, mouseY) {
  if (gameOver) return;
  isDragging = true;
  selectedCells = [];
  selectCell(gridX, gridY);
  updateCurrentMousePosition(mouseX, mouseY);
}

function continueSelection(gridX, gridY, mouseX, mouseY) {
  if (gameOver) return;
  selectCell(gridX, gridY);
  updateCurrentMousePosition(mouseX, mouseY);
}

function updateCurrentMousePosition(x, y) {
  currentX = x;
  currentY = y;
}

function endSelection() {
  if (!isDragging) return;
  isDragging = false;
  if (!gameOver) {
    checkSum();
  }
  clearSelectedCells();
}

function clearSelectedCells() {
  selectedCells = [];
}

function endGame() {
  if (gameOver) return;

  gameOver = true;
  isDragging = false;
  selectedCells = [];

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("tenline.highScore", highScore);
    highScoreSpan.textContent = highScore;
  }

  finalScoreValueSpan.textContent = score;
  gameOverHighScoreValueSpan.textContent = highScore;
  gameOverScreen.style.display = "flex";
}

function resetGame() {
  score = 0;
  timeLeft = INITIAL_TIME;
  gameOver = false;
  gameStarted = false;
  fallingCells = [];
  selectedCells = [];
  isDragging = false;

  if (currentScoreSpan) currentScoreSpan.textContent = score;
  if (gameGaugeFill) gameGaugeFill.style.width = "100%";

  if (gameOverScreen) {
    gameOverScreen.style.display = "none";
  }

  resetGrid();
}

function getRandomNumberWithWeights() {
  let totalWeight = 0;
  for (let weight in numberWeights) {
    totalWeight += numberWeights[weight];
  }

  let randomNumber = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  for (let number in numberWeights) {
    cumulativeWeight += numberWeights[number];
    if (randomNumber <= cumulativeWeight) {
      return parseInt(number);
    }
  }

  return 1;
}

function resetGrid() {
  grid = [];
  for (let y = 0; y <= GRID_SIZE + 1; y++) {
    grid[y] = [];
    for (let x = 0; x <= GRID_SIZE + 1; x++) {
      if (x >= 1 && x <= GRID_SIZE && y >= 1 && y <= GRID_SIZE) {
        grid[y][x] = {
          number: getRandomNumberWithWeights(),
          alpha: 1,
          fadeSpeed: 0.02 + Math.random() * 0.04,
          scale: 1,
          scaleVelocity: 0,
          scaleSpring: 0.2,
          scaleFriction: 0.2,
          targetScale: 1,
        };
      } else {
        grid[y][x] = null;
      }
    }
  }
}

function selectCell(x, y) {
  if (!isValidGridPosition(x, y) || !grid[y][x]) {
    return;
  }

  if (selectedCells.length > 0) {
    const lastCell = selectedCells[selectedCells.length - 1];
    if (lastCell.x === x && lastCell.y === y) {
      return;
    }
  }

  if (
    selectedCells.length === 0 ||
    (isAdjacent(x, y, selectedCells[selectedCells.length - 1]) &&
      !isCellSelected(x, y))
  ) {
    selectedCells.push({
      x: x,
      y: y,
    });
  } else if (
    selectedCells.length > 1 &&
    isAdjacent(x, y, selectedCells[selectedCells.length - 1])
  ) {
    const secondLastCell = selectedCells[selectedCells.length - 2];
    if (secondLastCell.x === x && secondLastCell.y === y) {
      selectedCells.pop();
    }
  }
}

function isCellSelected(x, y) {
  for (let cell of selectedCells) {
    if (cell.x === x && cell.y === y) {
      return true;
    }
  }
  return false;
}

function isAdjacent(x1, y1, cell2) {
  const dx = Math.abs(x1 - cell2.x);
  const dy = Math.abs(y1 - cell2.y);
  return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
}

function isPointInCircle(px, py, cx, cy, radius) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function getGridPosition(x, y) {
  if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) {
    return null;
  }

  const gridX = Math.floor(x / CELL_SIZE) + 1;
  const gridY = Math.floor(y / CELL_SIZE) + 1;

  if (!isValidGridPosition(gridX, gridY)) {
    return null;
  }

  const centerX = (gridX - 0.5) * CELL_SIZE;
  const centerY = (gridY - 0.5) * CELL_SIZE;
  const radius = CELL_SIZE * 0.45;

  if (isPointInCircle(x, y, centerX, centerY, radius)) {
    return { gridX, gridY };
  } else {
    return null;
  }
}

function isValidGridPosition(x, y) {
  return x >= 1 && x <= GRID_SIZE && y >= 1 && y <= GRID_SIZE;
}

function checkSum() {
  if (selectedCells.length < 2) {
    return;
  }

  let sum = 0;
  for (let cell of selectedCells) {
    if (grid[cell.y] && grid[cell.y][cell.x]) {
      sum += grid[cell.y][cell.x].number;
    } else {
      console.error("Error: Trying to sum a non-existent cell.", cell);
      return;
    }
  }

  if (sum === 10) {
    updateScore();
    createFallingCells();
  }
}

class FallingCell {
  constructor(x, y, number) {
    this.x = (x - 0.5) * CELL_SIZE;
    this.y = (y - 0.5) * CELL_SIZE;
    this.number = number;
    this.speedX = (Math.random() - 0.5) * 8;
    this.speedY = Math.random() * -8 - 2;
    this.gravity = 0.3;
    this.alpha = 1;
    this.radius = CELL_SIZE * 0.4;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.friction = 0.99;
    this.bounceFactor = 0.5;
  }

  update(dt) {
    this.speedY += this.gravity;

    this.speedX *= this.friction;
    this.speedY *= this.friction;

    this.x += this.speedX;
    this.y += this.speedY;

    const floorY = canvas.height - this.radius;
    if (this.y > floorY) {
      this.y = floorY;
      this.speedY *= -this.bounceFactor;
      this.speedX *= 0.8;
      this.rotationSpeed *= 0.8;
    }

    const leftWall = this.radius;
    const rightWall = canvas.width - this.radius;
    if (this.x < leftWall) {
      this.x = leftWall;
      this.speedX *= -this.bounceFactor;
    } else if (this.x > rightWall) {
      this.x = rightWall;
      this.speedX *= -this.bounceFactor;
    }

    this.alpha -= 0.01;

    this.rotation += this.rotationSpeed;
  }

  draw() {
    if (this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);

    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.fillStyle = "#f5f5f5";
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = COLOR_TEXT;
    ctx.font = `bold ${this.radius * 0.8}px ${
      window.getComputedStyle(document.body).fontFamily
    }`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.number.toString(), 0, 1);

    ctx.restore();
  }
}

function updateFallingCells() {
  for (let i = fallingCells.length - 1; i >= 0; i--) {
    fallingCells[i].update();
    fallingCells[i].draw();

    if (
      fallingCells[i].alpha <= 0 ||
      fallingCells[i].y > canvas.height + fallingCells[i].radius * 2
    ) {
      fallingCells.splice(i, 1);
    }
  }
}

function createFallingCells() {
  selectedCells.forEach((cell) => {
    if (grid[cell.y] && grid[cell.y][cell.x]) {
      fallingCells.push(
        new FallingCell(cell.x, cell.y, grid[cell.y][cell.x].number)
      );
      grid[cell.y][cell.x] = {
        number: getRandomNumberWithWeights(),
        alpha: 0,
        fadeSpeed: 0.05 + Math.random() * 0.05,
        scale: 0,
        scaleVelocity: 0,
        scaleSpring: 0.25,
        scaleFriction: 0.2,
        targetScale: 1,
      };
    } else {
      console.error(
        "Attempted to create falling cell from invalid grid position:",
        cell
      );
    }
  });
}

function updateScore() {
  const baseScore = selectedCells.length;
  const multiplier = Math.pow(1.1, selectedCells.length - 2);
  const earnedScore = Math.floor(baseScore * multiplier * 10);

  score += earnedScore;

  currentScoreSpan.textContent = score;

  if (!gameStarted) {
    gameStarted = true;
  }

  playScoreSound();
}

function playScoreSound() {
  if (scoreSound) {
    scoreSound.currentTime = 0;
    scoreSound.play().catch((error) => {
      if (error.name !== "AbortError") {
        console.warn("Audio play failed:", error);
      }
    });
  }
}

let lastTime = Date.now();

function gameLoop() {
  const now = Date.now();
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

init();
