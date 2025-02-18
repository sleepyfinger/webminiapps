// Constants
const GRID_SIZE = 6;
const CELL_SIZE = 60;
const INITIAL_TIME = 60;
const WINDOW_WIDTH = GRID_SIZE * CELL_SIZE;
const WINDOW_HEIGHT = GRID_SIZE * CELL_SIZE + 50;

// 숫자별 가중치 (비율) 설정
const numberWeights = {
  1: 20,
  2: 20,
  3: 12,
  4: 8,
  5: 10,
  6: 12,
  7: 8,
  8: 5,
  9: 5,
};

// Global variables
let grid = [];
let selectedCells = [];
let score = 0;
let isDragging = false;
let currentX = 0,
  currentY = 0;
let timeLeft = INITIAL_TIME;
let gameOver = false;
let scoreFont, timeFont, cellFont, gameoverFont;
let scoreSound;
let restartButton;

// Canvas 설정
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = WINDOW_WIDTH;
canvas.height = WINDOW_HEIGHT;

function init() {
  // 오디오 및 버튼 요소 초기화
  scoreSound = document.getElementById("scoreSound");
  restartButton = document.getElementById("restartButton");

  // 게임 상태 초기화
  resetGame();

  // 폰트 설정
  scoreFont = "16px GameFont";
  timeFont = "20px GameFont";
  cellFont = "20px GameFont";
  gameoverFont = "20px GameFont";

  // 이벤트 리스너 연결
  setupEventListeners();

  // 게임 루프 시작
  gameLoop();
}

// 터치 이벤트 리스너 설정 함수
function setupTouchEventListeners() {
  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchend", handleTouchEnd);
}

// 터치 시작 이벤트 핸들러
function handleTouchStart(event) {
  event.preventDefault(); // prevent mouse event from being triggered
  const touch = event.touches[0];
  const { x, y } = getTouchPosition(touch);
  const cell = getGridPosition(x, y);

  if (cell) {
    startSelection(cell.gridX, cell.gridY, x, y);
  }
}

// 터치 이동 이벤트 핸들러
function handleTouchMove(event) {
  event.preventDefault(); // prevent scrolling while touching
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

// 터치 종료 이벤트 핸들러
function handleTouchEnd(event) {
  event.preventDefault();
  if (!isDragging) return;
  endSelection();
}

// 터치 위치 가져오기
function getTouchPosition(touch) {
  const x = touch.clientX - canvas.offsetLeft;
  const y = touch.clientY - canvas.offsetTop;
  return { x, y };
}

// 이벤트 리스너 설정 함수 수정
function setupEventListeners() {
  // Mouse event listeners
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  restartButton.addEventListener("click", resetGame);

  // Touch event listeners
  setupTouchEventListeners();
}

// 마우스 클릭 이벤트 핸들러
function handleMouseDown(event) {
  if (gameOver) return;
  const { x, y } = getMousePosition(event);
  const cell = getGridPosition(x, y);

  if (cell) {
    startSelection(cell.gridX, cell.gridY, x, y);
  }
}

// 마우스 이동 이벤트 핸들러
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

// 마우스 릴리스 이벤트 핸들러
function handleMouseUp(event) {
  if (!isDragging) return;
  endSelection();
}

// 마우스 위치 가져오기
function getMousePosition(event) {
  const x = event.clientX - canvas.offsetLeft;
  const y = event.clientY - canvas.offsetTop;
  return { x, y };
}

// Game logic
function update(dt) {
  if (!gameOver) {
    updateTime(dt);
  }
  updateDragging();
}

// 시간 업데이트
function updateTime(dt) {
  timeLeft = Math.max(0, timeLeft - dt); // 시간 감소 및 0 미만으로 내려가지 않도록 함
  if (timeLeft <= 0) {
    endGame();
  }
}

// 드래그 상태 업데이트
function updateDragging() {
  if (isDragging) {
    // currentX, currentY는 마우스 이벤트 리스너에서 업데이트됩니다.
  }
}

// Drawing
function draw() {
  clearCanvas();

  if (!gameOver) {
    drawGrid();
    drawSelectedCells();
    drawLine();
    drawUI();
  } else {
    drawGameOver();
  }
}

// 캔버스 비우기
function clearCanvas() {
  ctx.clearRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
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
  const centerX = (x - 0.5) * CELL_SIZE;
  const centerY = (y - 0.5) * CELL_SIZE;
  const radius = CELL_SIZE * 0.45;

  // Draw cell background (circle)
  ctx.fillStyle = "rgba(204, 204, 204, 1)"; // Light gray
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fill();

  // Draw cell border (circle outline)
  ctx.strokeStyle = "rgba(128, 128, 128, 1)"; // Gray
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.stroke();

  // Draw number
  ctx.fillStyle = "rgba(0, 0, 0, 1)"; // Black
  ctx.font = cellFont;
  const text = grid[y][x].toString();
  const textWidth = ctx.measureText(text).width;
  const textHeight = 24; // 폰트 크기를 높이로 가정
  ctx.fillText(text, centerX - textWidth / 2, centerY + textHeight / 4); // 텍스트를 약간 아래로 이동
}

// 선택된 셀 그리기
function drawSelectedCells() {
  ctx.fillStyle = "rgba(255, 0, 0, 0.3)"; // Red with 30% opacity
  selectedCells.forEach((cell) => {
    const centerX = (cell.x - 0.5) * CELL_SIZE;
    const centerY = (cell.y - 0.5) * CELL_SIZE;
    const radius = CELL_SIZE * 0.45;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
  });
}

// 선 그리기
function drawLine() {
  if (selectedCells.length > 1) {
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)"; // Red with 50% opacity
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
    ctx.lineWidth = 1; // Reset line width
  }
}

// UI 그리기
function drawUI() {
  drawTime();
  drawProgressBar();
  drawScore();
}

// 시간 그리기
function drawTime() {
  drawUIElement(WINDOW_WIDTH - 160, WINDOW_HEIGHT - 35, 150, 40, () => {
    ctx.fillStyle = "rgba(255, 255, 255, 1)"; // White
    ctx.font = timeFont;
    ctx.fillText(
      "Time: " + timeLeft.toFixed(1),
      WINDOW_WIDTH - 150,
      WINDOW_HEIGHT - 10
    ); // Adjusted text position
  });
}

// 진행 막대 그리기
function drawProgressBar() {
  const barWidth = WINDOW_WIDTH - 20;
  const barHeight = 5;
  const barX = 10,
    barY = WINDOW_HEIGHT - 45;
  const timeRatio = timeLeft / INITIAL_TIME;

  // Background
  ctx.fillStyle = "rgba(51, 51, 51, 0.8)"; // Dark gray with 80% opacity
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Time remaining
  ctx.fillStyle = "rgba(25, 204, 25, 1)"; // Green
  ctx.fillRect(barX, barY, barWidth * timeRatio, barHeight);

  // Border
  ctx.strokeStyle = "rgba(255, 255, 255, 1)"; // White
  ctx.strokeRect(barX, barY, barWidth, barHeight);
}

// 점수 그리기
function drawScore() {
  drawUIElement(10, WINDOW_HEIGHT - 35, 150, 40, () => {
    ctx.fillStyle = "rgba(255, 255, 255, 1)"; // White
    ctx.font = scoreFont;
    ctx.fillText("Score: " + score, 20, WINDOW_HEIGHT - 10); // Adjusted text position
  });
}

// UI 요소 그리기
function drawUIElement(x, y, width, height, drawFunction) {
  ctx.fillStyle = "rgba(51, 51, 51, 0.8)"; // Dark gray with 80% opacity
  ctx.fillRect(x, y, width, height);
  drawFunction();
}

// 게임 오버 화면 그리기
function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
  ctx.fillStyle = "rgba(255, 255, 255, 1)";
  ctx.font = gameoverFont;
  ctx.textAlign = "center";
  ctx.fillText("Game Over", WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2 - 20);
  ctx.font = scoreFont;
  ctx.fillText(
    "Final Score: " + score,
    WINDOW_WIDTH / 2,
    WINDOW_HEIGHT / 2 + 20
  );
  ctx.textAlign = "left";

  // 다시 시작 버튼 표시
  restartButton.style.display = "block";
}

// Game state management
function startSelection(gridX, gridY, mouseX, mouseY) {
  isDragging = true;
  selectCell(gridX, gridY);
  updateCurrentMousePosition(mouseX, mouseY);
}

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

// Helper functions
function resetGame() {
  score = 0;
  timeLeft = INITIAL_TIME;
  gameOver = false;
  resetGrid();

  // 다시 시작 버튼 숨기기
  restartButton.style.display = "none";
}

// 가중치를 적용한 랜덤 숫자 생성 함수
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

  // 만약 어떤 숫자도 선택되지 않았다면 기본값으로 1을 반환 (에러 방지)
  return 1;
}

// 그리드 초기화
function resetGrid() {
  for (let y = 1; y <= GRID_SIZE; y++) {
    grid[y] = [];
    for (let x = 1; x <= GRID_SIZE; x++) {
      // 가중치를 적용한 랜덤 숫자 할당
      grid[y][x] = getRandomNumberWithWeights();
    }
  }
}

// 셀 선택
function selectCell(x, y) {
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

// 셀이 선택되었는지 확인
function isCellSelected(x, y) {
  for (let cell of selectedCells) {
    if (cell.x === x && cell.y === y) {
      return true;
    }
  }
  return false;
}

// 인접한 셀인지 확인
function isAdjacent(x1, y1, cell2) {
  const dx = Math.abs(x1 - cell2.x);
  const dy = Math.abs(y1 - cell2.y);
  return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
}

// 좌표가 원 안에 있는지 확인
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

// 유효한 그리드 위치인지 확인
function isValidGridPosition(x, y) {
  return x >= 1 && x <= GRID_SIZE && y >= 1 && y <= GRID_SIZE;
}

// 합계 확인
function checkSum() {
  let sum = 0;
  for (let cell of selectedCells) {
    sum += grid[cell.y][cell.x];
  }

  if (sum === 10) {
    updateScore();

    for (let cell of selectedCells) {
      // 가중치를 적용한 랜덤 숫자로 교체
      grid[cell.y][cell.x] = getRandomNumberWithWeights();
    }
  }
}

// 점수 업데이트
function updateScore() {
  const baseScore = selectedCells.length;
  const multiplier = Math.pow(1.5, selectedCells.length - 2); // 1.5의 (선택된 셀 수 - 2)제곱
  const earnedScore = Math.floor(baseScore * multiplier);

  score += earnedScore;
  // timeLeft = timeLeft + selectedCells.length;

  // 점수 획득 시 사운드 재생
  playScoreSound();

  // 디버그 정보 출력
  console.log(
    "Cells removed: " + selectedCells.length + ", Score earned: " + earnedScore
  );
}

// 점수 사운드 재생
function playScoreSound() {
  scoreSound.currentTime = 0; // 사운드를 처음부터 재생
  scoreSound.play().catch((error) => console.log("Audio play failed:", error));
}

// 게임 루프
function gameLoop() {
  const now = Date.now();
  const dt = (now - lastTime) / 1000; // 초 단위
  update(dt);
  draw();
  lastTime = now;
  requestAnimationFrame(gameLoop);
}

let lastTime = Date.now();

// 게임 시작
init();
