// Constants
const GRID_SIZE = 6;
const CELL_SIZE = 60;
const INITIAL_TIME = 60;
const WINDOW_WIDTH = GRID_SIZE * CELL_SIZE;
const WINDOW_HEIGHT = GRID_SIZE * CELL_SIZE + 50;

// Color Palette
const COLOR_CELL_BG = "rgba(228, 228, 228,";
const COLOR_CELL_BORDER = "rgba(128, 128, 128,";
const COLOR_TEXT = "rgba(80, 80, 80,";
const COLOR_CELL_SELECTED = "rgba(255, 0, 0, 0.3)";
const COLOR_LINE = "rgba(218, 27, 27, 0.66)";
const COLOR_UI = "rgba(105, 105, 105, 0.8)";
const COLOR_PROGRESS = "rgba(25, 204, 25, 1)";
const COLOR_UI_TEXT = "rgba(255, 255, 255, 1)";
const COLOR_GAME_OVER_BG = "rgba(49, 46, 46, 0.57)";

// 숫자별 가중치 (비율) 설정
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

// Global variables
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
let scoreFont, hsFont, timeFont, cellFont, gameoverFont;
let scoreSound;
let resetButton;
let scaleMaxButton;
let scaleUpButton;
let scaleDownButton;
let scaleResetButton;
let currentScale = 1;
const minScale = 1.0;
const maxScale = 2.5;

// Canvas 설정
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = WINDOW_WIDTH;
canvas.height = WINDOW_HEIGHT;

// 떨어지는 셀을 저장할 배열
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

// 게임 초기화
function init() {
  scoreSound = document.getElementById("scoreSound");
  resetButton = document.getElementById("resetButton");
  scaleMaxButton = document.getElementById("scaleMaxButton");
  scaleUpButton = document.getElementById("scaleUpButton");
  scaleDownButton = document.getElementById("scaleDownButton");
  scaleResetButton = document.getElementById("scaleResetButton");

  resetGame();

  const bodyFont = window.getComputedStyle(document.body).fontFamily;

  scoreFont = `16px ${bodyFont}`;
  hsFont = `12px ${bodyFont}`;
  timeFont = `20px ${bodyFont}`;
  cellFont = `20px ${bodyFont}`;
  gameoverFont = `20px ${bodyFont}`;

  highScore = localStorage.getItem("tenline.highScore") || 0;

  setupEventListeners();

  gameLoop();
}

// 터치 이벤트 리스너 설정
function setupTouchEventListeners() {
  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchend", handleTouchEnd);
}

// 터치 시작 이벤트 처리
function handleTouchStart(event) {
  event.preventDefault();
  const touch = event.touches[0];
  const { x, y } = getTouchPosition(touch);
  const cell = getGridPosition(x, y);

  if (cell) {
    startSelection(cell.gridX, cell.gridY, x, y);
  }
}

// 터치 이동 이벤트 처리
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

// 터치 종료 이벤트 처리
function handleTouchEnd(event) {
  event.preventDefault();
  if (!isDragging) return;
  endSelection();
}

// 터치 위치 가져오기
function getTouchPosition(touch) {
  const rect = canvas.getBoundingClientRect();
  const x = (touch.clientX - rect.left) / currentScale;
  const y = (touch.clientY - rect.top) / currentScale;
  return { x, y };
}

// 이벤트 리스너 설정
function setupEventListeners() {
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  resetButton.addEventListener("click", resetGame);

  setupTouchEventListeners();

  scaleMaxButton.addEventListener("click", () => setScale(maxScale));
  scaleUpButton.addEventListener("click", () => setScale(currentScale + 0.25));
  scaleDownButton.addEventListener("click", () =>
    setScale(currentScale - 0.25)
  );
  scaleResetButton.addEventListener("click", () => setScale(1));
}

// 마우스 클릭 이벤트 처리
function handleMouseDown(event) {
  if (gameOver) return;
  const { x, y } = getMousePosition(event);
  const cell = getGridPosition(x, y);

  if (cell) {
    startSelection(cell.gridX, cell.gridY, x, y);
  }
}

// 마우스 이동 이벤트 처리
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

// 마우스 릴리스 이벤트 처리
function handleMouseUp(event) {
  if (!isDragging) return;
  endSelection();
}

// 마우스 위치 가져오기
function getMousePosition(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / currentScale;
  const y = (event.clientY - rect.top) / currentScale;
  return { x, y };
}

// 게임 로직 업데이트
function update(dt) {
  if (!gameOver && gameStarted) {
    updateTime(dt);
  }
}

// 시간 업데이트
function updateTime(dt) {
  timeLeft = Math.max(0, timeLeft - dt);
  if (timeLeft <= 0) {
    endGame();
  }
}

// 캔버스 스케일 설정
function setScale(scale) {
  scale = Math.max(minScale, Math.min(maxScale, scale));
  currentScale = scale;

  canvas.width = WINDOW_WIDTH * currentScale;
  canvas.height = WINDOW_HEIGHT * currentScale;

  canvas.style.width = `${WINDOW_WIDTH * currentScale}px`;
  canvas.style.height = `${WINDOW_HEIGHT * currentScale}px`;

  ctx.scale(currentScale, currentScale);

  draw();
}

// 그리기 함수
function draw() {
  clearCanvas();

  if (!gameOver) {
    drawGrid();
    drawSelectedCells();
    drawLine();
    drawUI();
    updateFallingCells();
  } else {
    drawGameOver();
  }
}

// 캔버스 비우기
function clearCanvas() {
  ctx.clearRect(
    0,
    0,
    WINDOW_WIDTH * currentScale,
    WINDOW_HEIGHT * currentScale
  );
}

// 그리드 그리기
function drawGrid() {
  for (let y = 1; y <= GRID_SIZE; y++) {
    for (let x = 1; x <= GRID_SIZE; x++) {
      drawCell(x, y);
    }
  }
}

// 셀 그리기
function drawCell(x, y) {
  const cellData = grid[y][x];
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

  ctx.fillStyle = `${COLOR_CELL_BG} ${cellData.alpha})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * cellData.scale, 0, 2 * Math.PI);
  ctx.fill();

  ctx.strokeStyle = `${COLOR_CELL_BORDER} ${cellData.alpha})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * cellData.scale, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.fillStyle = `${COLOR_TEXT} ${cellData.alpha})`;
  ctx.font = cellFont;
  const text = cellData.number.toString();
  const textWidth = ctx.measureText(text).width * cellData.scale;
  const textHeight = 24 * cellData.scale;

  ctx.fillText(text, centerX - textWidth / 2, centerY + textHeight / 4);
}

// 선택된 셀 그리기
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

// 선택된 셀 연결선 그리기
function drawLine() {
  if (selectedCells.length > 1) {
    ctx.strokeStyle = COLOR_LINE;
    ctx.lineWidth = 5;

    for (let i = 0; i < selectedCells.length - 1; i++) {
      const cell1 = selectedCells[i];
      const cell2 = selectedCells[i + 1];

      ctx.beginPath();
      ctx.moveTo((cell1.x - 0.5) * CELL_SIZE, (cell1.y - 0.5) * CELL_SIZE);
      ctx.lineTo((cell2.x - 0.5) * CELL_SIZE, (cell2.y - 0.5) * CELL_SIZE);
      ctx.stroke();
    }

    if (isDragging) {
      const lastCell = selectedCells[selectedCells.length - 1];
      ctx.beginPath();
      ctx.moveTo(
        (lastCell.x - 0.5) * CELL_SIZE,
        (lastCell.y - 0.5) * CELL_SIZE
      );

      ctx.lineTo(currentX, currentY);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
}

// UI 그리기
function drawUI() {
  drawProgressBar();
  drawScore();
  drawHighScore();
}

// 진행 막대 그리기
function drawProgressBar() {
  const barWidth = WINDOW_WIDTH - 20;
  const barHeight = 5;
  const barX = 10,
    barY = WINDOW_HEIGHT - 45;
  const timeRatio = timeLeft / INITIAL_TIME;

  ctx.fillStyle = COLOR_UI;
  ctx.fillRect(barX, barY, barWidth, barHeight);

  ctx.fillStyle = COLOR_PROGRESS;
  ctx.fillRect(barX, barY, barWidth * timeRatio, barHeight);

  ctx.strokeStyle = COLOR_UI_TEXT;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
}

// 점수 그리기
function drawScore() {
  drawUIElement(10, WINDOW_HEIGHT - 35, 150, 40, () => {
    ctx.fillStyle = COLOR_UI_TEXT;
    ctx.font = scoreFont;
    ctx.fillText("Score: " + score, 20, WINDOW_HEIGHT - 10);
  });
}

// 하이스코어 그리기
function drawHighScore() {
  drawUIElement(WINDOW_WIDTH - 160, WINDOW_HEIGHT - 35, 150, 40, () => {
    ctx.fillStyle = COLOR_UI_TEXT;
    ctx.font = scoreFont;
    ctx.fillText("HS: " + highScore, WINDOW_WIDTH - 150, WINDOW_HEIGHT - 10);
  });
}

// UI 요소 그리기
function drawUIElement(x, y, width, height, drawFunction) {
  ctx.fillStyle = COLOR_UI;
  ctx.fillRect(x, y, width, height);
  drawFunction();
}

// 게임 오버 화면 그리기
function drawGameOver() {
  ctx.fillStyle = COLOR_GAME_OVER_BG;
  ctx.fillRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
  ctx.fillStyle = COLOR_UI_TEXT;
  ctx.font = gameoverFont;
  ctx.textAlign = "center";
  ctx.fillText("Game Over", WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2 - 50);
  ctx.font = hsFont;
  ctx.fillText("High Score: " + highScore, WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2);
  ctx.font = scoreFont;
  ctx.fillText(
    "Final Score: " + score,
    WINDOW_WIDTH / 2,
    WINDOW_HEIGHT / 2 + 30
  );

  // 다시 시작 버튼 그리기 및 클릭 처리
  const drawRestartButton = () => {
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = WINDOW_WIDTH / 2 - buttonWidth / 2;
    const buttonY = WINDOW_HEIGHT / 2 + 70;

    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    ctx.fillStyle = "white";
    ctx.font = "25px";
    ctx.textAlign = "center";
    ctx.fillText("다시 시작", WINDOW_WIDTH / 2, buttonY + 33);
    ctx.textAlign = "left";

    const handleRestartClick = (event) => {
      let x, y;

      if (event.type === "touchstart") {
        event.preventDefault();
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        x = (touch.clientX - rect.left) / currentScale;
        y = (touch.clientY - rect.top) / currentScale;
      } else {
        const rect = canvas.getBoundingClientRect();
        x = (event.clientX - rect.left) / currentScale;
        y = (event.clientY - rect.top) / currentScale;
      }

      if (
        x > buttonX &&
        x < buttonX + buttonWidth &&
        y > buttonY &&
        y < buttonY + buttonHeight
      ) {
        resetGame();
        canvas.removeEventListener("click", handleRestartClick);
        canvas.removeEventListener("touchstart", handleRestartClick);
      }
    };

    canvas.addEventListener("click", handleRestartClick);
    canvas.addEventListener("touchstart", handleRestartClick);
  };

  drawRestartButton();

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("tenline.highScore", highScore);
  }
}

// 선택 시작
function startSelection(gridX, gridY, mouseX, mouseY) {
  isDragging = true;
  selectCell(gridX, gridY);
  updateCurrentMousePosition(mouseX, mouseY);
}

// 선택 지속
function continueSelection(gridX, gridY, mouseX, mouseY) {
  selectCell(gridX, gridY);
  updateCurrentMousePosition(mouseX, mouseY);
}

// 마우스 좌표 업데이트
function updateCurrentMousePosition(x, y) {
  currentX = x;
  currentY = y;
}

// 선택 종료
function endSelection() {
  isDragging = false;
  checkSum();
  clearSelectedCells();
}

// 선택된 셀 초기화
function clearSelectedCells() {
  selectedCells = [];
}

// 게임 종료 처리
function endGame() {
  gameOver = true;
}

// 게임 초기화
function resetGame() {
  score = 0;
  timeLeft = INITIAL_TIME;
  gameOver = false;
  gameStarted = false;
  fallingCells = [];
  resetGrid();
}

// 가중치를 적용한 랜덤 숫자 생성
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

// 그리드 초기화
function resetGrid() {
  for (let y = 1; y <= GRID_SIZE; y++) {
    grid[y] = [];
    for (let x = 1; x <= GRID_SIZE; x++) {
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
    }
  }
}

// 셀 선택
function selectCell(x, y) {
  if (!isValidGridPosition(x, y)) {
    return;
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
  }
}

// 셀 선택 여부 확인
function isCellSelected(x, y) {
  for (let cell of selectedCells) {
    if (cell.x === x && cell.y === y) {
      return true;
    }
  }
  return false;
}

// 인접 셀 확인
function isAdjacent(x1, y1, cell2) {
  const dx = Math.abs(x1 - cell2.x);
  const dy = Math.abs(y1 - cell2.y);
  return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
}

// 원 내부 좌표 확인
function isPointInCircle(px, py, cx, cy, radius) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

// 그리드 위치 가져오기
function getGridPosition(x, y) {
  const gridX = Math.floor(x / CELL_SIZE) + 1;
  const gridY = Math.floor(y / CELL_SIZE) + 1;
  const centerX = (gridX - 0.5) * CELL_SIZE;
  const centerY = (gridY - 0.5) * CELL_SIZE;
  const radius = CELL_SIZE * 0.45;

  if (isPointInCircle(x, y, centerX, centerY, radius)) {
    return { gridX, gridY };
  } else {
    return null;
  }
}

// 유효한 그리드 위치 확인
function isValidGridPosition(x, y) {
  return x >= 1 && x <= GRID_SIZE && y >= 1 && y <= GRID_SIZE;
}

// 합계 확인
function checkSum() {
  let sum = 0;
  for (let cell of selectedCells) {
    sum += grid[cell.y][cell.x].number;
  }

  if (sum === 10) {
    updateScore();
    createFallingCells();
    clearSelectedCells();
  } else {
    clearSelectedCells();
  }
}

// 떨어지는 셀 클래스
class FallingCell {
  constructor(x, y, number) {
    this.x = (x - 0.5) * CELL_SIZE;
    this.y = (y - 0.5) * CELL_SIZE;
    this.number = number;
    this.speedX = (Math.random() - 0.5) * 10;
    this.speedY = Math.random() * -10;
    this.gravity = 0.5;
    this.alpha = 1;
    this.radius = CELL_SIZE * 0.45;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    this.friction = 0.98;
  }

  update() {
    this.speedY += this.gravity;

    if (this.y + this.radius > canvas.height / currentScale) {
      this.y = canvas.height / currentScale - this.radius;
      this.speedY = -this.speedY * 0.7;
    }

    this.speedX *= this.friction;
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= 0.011;
    this.rotation += this.rotationSpeed;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);

    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.fillStyle = `${COLOR_CELL_BG} 1)`;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = `${COLOR_CELL_BORDER} 1)`;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = `${COLOR_TEXT} 1)`;
    ctx.font = cellFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.number.toString(), 0, 0);

    ctx.restore();
  }
}

// 떨어지는 셀 업데이트
function updateFallingCells() {
  for (let i = fallingCells.length - 1; i >= 0; i--) {
    fallingCells[i].update();
    fallingCells[i].draw();

    if (fallingCells[i].alpha <= 0 || fallingCells[i].y > canvas.height) {
      fallingCells.splice(i, 1);
    }
  }
}

// 떨어지는 셀 생성
function createFallingCells() {
  selectedCells.forEach((cell) => {
    fallingCells.push(
      new FallingCell(cell.x, cell.y, grid[cell.y][cell.x].number)
    );
    grid[cell.y][cell.x] = {
      number: getRandomNumberWithWeights(),
      alpha: 0,
      fadeSpeed: 0.02 + Math.random() * 0.04,
      scale: 0,
      scaleVelocity: 0,
      scaleSpring: 0.2,
      scaleFriction: 0.2,
      targetScale: 1,
    };
  });
}

// 점수 업데이트
function updateScore() {
  const baseScore = selectedCells.length;
  const multiplier = Math.pow(1.25, selectedCells.length - 2);
  const earnedScore = Math.floor(baseScore * multiplier);

  score += earnedScore;
  if (!gameStarted) {
    gameStarted = true;
  }

  playScoreSound();

  console.log(
    "Cells removed: " + selectedCells.length + ", Score earned: " + earnedScore
  );
}

// 점수 사운드 재생
function playScoreSound() {
  scoreSound.currentTime = 0;
  scoreSound.play().catch((error) => console.log("Audio play failed:", error));
}

// 게임 루프
function gameLoop() {
  const now = Date.now();
  const dt = (now - lastTime) / 1000;
  update(dt);
  draw();
  lastTime = now;
  requestAnimationFrame(gameLoop);
}

let lastTime = Date.now();

// 게임 시작
init();
