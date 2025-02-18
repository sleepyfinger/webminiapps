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
let highScore = 0;
let isDragging = false;
let currentX = 0,
  currentY = 0;
let timeLeft = INITIAL_TIME;
let gameOver = false;
let scoreFont, hsFont, timeFont, cellFont, gameoverFont;
let scoreSound;
let restartButton;
let resetButton;
let scaleUpButton;
let scaleDownButton;
let scaleResetButton;
let currentScale = 1; // 현재 스케일 값
const minScale = 1.0; // 최소 스케일 값
const maxScale = 2.75; // 최대 스케일 값

// Canvas 설정
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = WINDOW_WIDTH;
canvas.height = WINDOW_HEIGHT;

// 떨어지는 셀을 저장할 배열
let fallingCells = [];

function init() {
  // 오디오 및 버튼 요소 초기화
  scoreSound = document.getElementById("scoreSound");
  restartButton = document.getElementById("restartButton");
  resetButton = document.getElementById("resetButton");
  scaleUpButton = document.getElementById("scaleUpButton");
  scaleDownButton = document.getElementById("scaleDownButton");
  scaleResetButton = document.getElementById("scaleResetButton");

  // 게임 상태 초기화
  resetGame();

  // 폰트 설정
  scoreFont = "16px GameFont";
  hsFont = "12px GameFont";
  timeFont = "20px GameFont";
  cellFont = "20px GameFont";
  gameoverFont = "20px GameFont";

  // 로컬 스토리지에서 하이스코어 불러오기
  highScore = localStorage.getItem("highScore") || 0;

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
  const rect = canvas.getBoundingClientRect();
  const x = (touch.clientX - rect.left) / currentScale;
  const y = (touch.clientY - rect.top) / currentScale;
  return { x, y };
}

// 이벤트 리스너 설정 함수 수정
function setupEventListeners() {
  // Mouse event listeners
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  restartButton.addEventListener("click", resetGame);
  resetButton.addEventListener("click", resetGame);

  // Touch event listeners
  setupTouchEventListeners();

  // Scale event listeners
  scaleUpButton.addEventListener("click", () => setScale(currentScale + 0.25));
  scaleDownButton.addEventListener("click", () =>
    setScale(currentScale - 0.25)
  );
  scaleResetButton.addEventListener("click", resetScale);
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
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / currentScale;
  const y = (event.clientY - rect.top) / currentScale;
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

// 캔버스 스케일 설정 함수
function setScale(scale) {
  scale = Math.max(minScale, Math.min(maxScale, scale)); // 스케일 값을 최소, 최대값 사이로 제한
  currentScale = scale;

  // 캔버스 크기 업데이트
  canvas.width = WINDOW_WIDTH * currentScale;
  canvas.height = WINDOW_HEIGHT * currentScale;

  // 캔버스 스타일 변환 적용 (확대/축소)
  canvas.style.width = `${WINDOW_WIDTH * currentScale}px`;
  canvas.style.height = `${WINDOW_HEIGHT * currentScale}px`;

  // 캔버스 스케일 조정
  ctx.scale(currentScale, currentScale);

  // 폰트 크기 업데이트 (스케일에 비례하여 조정)
  scoreFont = `16px GameFont`;
  timeFont = `20px GameFont`;
  cellFont = `20px GameFont`;
  gameoverFont = `20px GameFont`;

  // draw 함수를 호출하여 캔버스를 다시 그립니다.
  draw();
}

function resetScale() {
  setScale(1);
}

// Drawing
function draw() {
  clearCanvas();

  if (!gameOver) {
    drawGrid();
    drawSelectedCells();
    drawLine();
    drawUI();
    updateFallingCells(); // 떨어지는 셀 업데이트 및 그리기
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

  // 투명도 업데이트
  if (cellData.alpha < 1) {
    cellData.alpha += cellData.fadeSpeed;
    cellData.alpha = Math.min(1, cellData.alpha); // 최대 투명도 1로 제한
  }

  // 스프링 효과를 적용한 크기 업데이트
  const force = cellData.targetScale - cellData.scale;
  const acceleration = force * cellData.scaleSpring;
  cellData.scaleVelocity += acceleration;
  cellData.scaleVelocity *= 1 - cellData.scaleFriction;
  cellData.scale += cellData.scaleVelocity;

  // Draw cell background (circle)
  ctx.fillStyle = `rgba(204, 204, 204, ${cellData.alpha})`; // Light gray with opacity
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * cellData.scale, 0, 2 * Math.PI);
  ctx.fill();

  // Draw cell border (circle outline)
  ctx.strokeStyle = `rgba(128, 128, 128, ${cellData.alpha})`; // Gray with opacity
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * cellData.scale, 0, 2 * Math.PI);
  ctx.stroke();

  // Draw number
  ctx.fillStyle = `rgba(0, 0, 0, ${cellData.alpha})`; // Black with opacity
  ctx.font = cellFont;
  const text = cellData.number.toString();
  const textWidth = ctx.measureText(text).width * cellData.scale; // 텍스트 크기도 스케일에 맞춰 조정
  const textHeight = 24 * cellData.scale; // 폰트 크기를 높이로 가정

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
      // 스케일된 마우스 좌표를 보정
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
    }
    ctx.lineWidth = 1; // Reset line width
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

// 하이스코어 그리기
function drawHighScore() {
  drawUIElement(WINDOW_WIDTH - 160, WINDOW_HEIGHT - 35, 150, 40, () => {
    ctx.fillStyle = "rgba(255, 255, 255, 1)"; // White
    ctx.font = scoreFont;
    ctx.fillText("HS: " + highScore, WINDOW_WIDTH - 150, WINDOW_HEIGHT - 10); // Adjusted text position
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
  ctx.font = hsFont;
  ctx.fillText(
    "High Score: " + highScore,
    WINDOW_WIDTH / 2,
    WINDOW_HEIGHT / 2 + 20
  );
  ctx.font = scoreFont;
  ctx.fillText(
    "Final Score: " + score,
    WINDOW_WIDTH / 2,
    WINDOW_HEIGHT / 2 + 50
  );
  ctx.textAlign = "left";

  if (score > highScore) {
    highScore = score;

    // 새로운 하이스코어를 로컬 스토리지에 저장
    localStorage.setItem("highScore", highScore);
  }

  // 다시 시작 버튼 표시
  restartButton.style.display = "block";
  resetButton.style.display = "none";
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
  resetButton.style.display = "";
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
      grid[y][x] = {
        number: getRandomNumberWithWeights(),
        alpha: 1, // 초기 투명도 0으로 설정
        fadeSpeed: 0.02 + Math.random() * 0.04, // 랜덤 페이드 속도
        scale: 1, // 초기 크기 0으로 설정
        scaleVelocity: 0, // 크기 변화 속도
        scaleSpring: 0.2, // 스프링 강도
        scaleFriction: 0.2, // 마찰력
        targetScale: 1, // 목표 크기
      };
    }
  }
}

// 셀 선택
function selectCell(x, y) {
  if (!isValidGridPosition(x, y)) {
    return; // 유효하지 않은 위치면 함수 종료
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
    sum += grid[cell.y][cell.x].number;
  }

  if (sum === 10) {
    updateScore();
    createFallingCells(); // 떨어지는 셀 생성
    clearSelectedCells(); // 선택된 셀 초기화
  } else {
    clearSelectedCells(); // 합이 10이 아니면 선택 해제
  }
}

// 떨어지는 셀 클래스
class FallingCell {
  constructor(x, y, number) {
    this.x = (x - 0.5) * CELL_SIZE; // 셀의 중앙 x 좌표
    this.y = (y - 0.5) * CELL_SIZE; // 셀의 중앙 y 좌표
    this.number = number; // 셀 숫자 값
    this.speedX = (Math.random() - 0.5) * 10; // X축 초기 속도 (무작위)
    this.speedY = Math.random() * 10; // Y축 초기 속도 (아래 방향)
    this.gravity = 0.5; // 중력 가속도
    this.alpha = 1; // 투명도
    this.radius = CELL_SIZE * 0.45; // 셀 반지름
    this.rotation = Math.random() * Math.PI * 2; // 초기 회전 각도
    this.rotationSpeed = (Math.random() - 0.5) * 0.2; // 회전 속도
    this.friction = 0.98; // 마찰력
  }

  update() {
    this.speedY += this.gravity; // 중력에 따라 속도 증가
    this.speedX *= this.friction; // X축 속도 감소 (마찰력)
    this.x += this.speedX; // x 좌표 갱신
    this.y += this.speedY; // y 좌표 갱신
    this.alpha -= 0.02; // 투명도 감소
    this.rotation += this.rotationSpeed; // 회전
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha); // 투명도 설정, 0 이하 방지

    // 회전 적용
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // 셀 배경 (원) 그리기
    ctx.fillStyle = "rgba(204, 204, 204, 1)"; // 연한 회색
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
    ctx.fill();

    // 셀 테두리 (원) 그리기
    ctx.strokeStyle = "rgba(128, 128, 128, 1)"; // 회색
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
    ctx.stroke();

    // 숫자 그리기
    ctx.fillStyle = "rgba(0, 0, 0, 1)"; // 검정색
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
      fallingCells.splice(i, 1); // 투명도가 0 이하이거나 화면 밖으로 나가면 제거
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
    }; // 새로운 숫자로 교체 및 속성 초기화
  });
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
