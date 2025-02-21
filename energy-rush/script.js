// 색상 설정 (파스텔 테마)
const COLORS = {
  player: "#A3C1DA", // 파스텔 블루
  item: "#FFB6B9", // 파스텔 핑크
  background: "#F8F4E3", // 파스텔 베이지
  energyBar: {
    background: "rgba(255, 255, 255, 0.8)", // 연한 흰색 배경
    fill: "#B2E0A0", // 파스텔 연두색
    border: "#FFD1DC", // 파스텔 연핑크
  },
  score: "#6A5ACD", // 파스텔 퍼플
  canvas: "#F8F4E3", // 캔버스 배경과 동일한 베이지색
};

// DOM 요소 선택
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameOverDisplay = document.getElementById("gameOver");
const restartButton = document.getElementById("restartButton");
const fullscreenButton = document.getElementById("fullscreenButton");

// 게임 상태 변수
let score = 0;
let gameRunning = true;

// 플레이어 객체
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 20,
  color: COLORS.player,
  speed: 5,
  energy: 100,
};

// 아이템 객체
let item = createItem();

// 키 입력 상태
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

// 방향키 객체
const directionButtons = {
  up: { x: 0, y: 0, width: 50, height: 50, text: "↑" },
  left: { x: 0, y: 0, width: 50, height: 50, text: "←" },
  right: { x: 0, y: 0, width: 50, height: 50, text: "→" },
  down: { x: 0, y: 0, width: 50, height: 50, text: "↓" },
};

// 방향키 위치 설정
function setDirectionButtonsPosition() {
  const padding = 10;
  const bottomPadding = 20;

  directionButtons.up.x = canvas.width / 2 - 25;
  directionButtons.up.y = canvas.height - 150 - bottomPadding;

  directionButtons.left.x = canvas.width / 2 - 75;
  directionButtons.left.y = canvas.height - 100 - bottomPadding;

  directionButtons.right.x = canvas.width / 2 + 25;
  directionButtons.right.y = canvas.height - 100 - bottomPadding;

  directionButtons.down.x = canvas.width / 2 - 25;
  directionButtons.down.y = canvas.height - 50 - bottomPadding;
}

// 방향키 그리기
function drawDirectionButtons() {
  Object.values(directionButtons).forEach((button) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillRect(button.x, button.y, button.width, button.height);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(button.x, button.y, button.width, button.height);
    ctx.fillStyle = "#000";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      button.text,
      button.x + button.width / 2,
      button.y + button.height / 2
    );
  });
}

// 마우스 이벤트 처리
canvas.addEventListener("mousedown", handleMouseEvent);
canvas.addEventListener("mouseup", handleMouseEvent);

function handleMouseEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  Object.entries(directionButtons).forEach(([direction, button]) => {
    if (
      x >= button.x &&
      x <= button.x + button.width &&
      y >= button.y &&
      y <= button.y + button.height
    ) {
      keys[`Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`] =
        e.type === "mousedown"; // mousedown이면 true, mouseup이면 false
    }
  });
}

// 터치 이벤트 처리
canvas.addEventListener("touchstart", handleTouchEvent);
canvas.addEventListener("touchend", handleTouchEventEnd);

function handleTouchEvent(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  Object.entries(directionButtons).forEach(([direction, button]) => {
    if (
      x >= button.x &&
      x <= button.x + button.width &&
      y >= button.y &&
      y <= button.y + button.height
    ) {
      keys[
        `Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`
      ] = true;
    }
  });
}

function handleTouchEventEnd() {
  Object.keys(keys).forEach((key) => (keys[key] = false));
}

function resizeCanvas() {
  const aspectRatio = 9 / 16;
  let newWidth, newHeight;

  if (window.innerWidth / window.innerHeight > aspectRatio) {
    newHeight = window.innerHeight;
    newWidth = newHeight * aspectRatio;
  } else {
    newWidth = window.innerWidth;
    newHeight = newWidth / aspectRatio;
  }

  canvas.width = newWidth;
  canvas.height = newHeight;

  // 플레이어와 아이템 위치 재조정
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  item = createItem();

  setDirectionButtonsPosition();
}

// 이벤트 리스너 추가
function addEventListeners() {
  // 키보드 이벤트
  window.addEventListener("keydown", (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
  });
  window.addEventListener("keyup", (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
  });

  // 재시작 버튼 이벤트
  restartButton.addEventListener("click", restartGame);

  // 풀스크린 버튼 이벤트
  fullscreenButton.addEventListener("click", toggleFullscreen);
}

// 풀스크린 전환 함수
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.log(`Fullscreen 요청 실패: ${err.message} (${err.name})`);
    });
  } else {
    document.exitFullscreen();
  }
}

// 아이템 생성
function createItem() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 10,
    color: COLORS.item,
    speedX: (Math.random() + 0.5) * 3,
    speedY: (Math.random() + 0.5) * 3,
  };
}

// 플레이어 이동
function movePlayer() {
  let isMoving = false; // 움직임 여부 확인 변수

  if (player.energy > 0) {
    if (keys.ArrowUp && player.y > player.size) {
      player.y -= player.speed;
      isMoving = true;
    }
    if (keys.ArrowDown && player.y < canvas.height - player.size) {
      player.y += player.speed;
      isMoving = true;
    }
    if (keys.ArrowLeft && player.x > player.size) {
      player.x -= player.speed;
      isMoving = true;
    }
    if (keys.ArrowRight && player.x < canvas.width - player.size) {
      player.x += player.speed;
      isMoving = true;
    }
  }

  if (isMoving) {
    consumeEnergy(); // 움직일 때만 에너지 소모
  }
}

// 아이템 이동
function moveItem() {
  item.x += item.speedX;
  item.y += item.speedY;

  // 벽에 부딪히면 방향 전환
  if (item.x <= item.size || item.x >= canvas.width - item.size) {
    item.speedX = -item.speedX;
  }
  if (item.y <= item.size || item.y >= canvas.height - item.size) {
    item.speedY = -item.speedY;
  }
}

// 충돌 감지
function checkCollision() {
  const dx = player.x - item.x;
  const dy = player.y - item.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < player.size + item.size) {
    item = createItem();
    if (player.size < 100) player.size += 2;
    player.energy = Math.min(player.energy + 5, 100);
    score += 10;
  }
}

// 에너지 소모
function consumeEnergy() {
  player.energy = Math.max(player.energy - 0.2, 0);
  if (player.energy <= 0 && gameRunning) {
    gameOver();
  }
}

// 기본 에너지 소모
function defaultConsumeEnergy() {
  player.energy = Math.max(player.energy - 0.02, 0);
  if (player.energy <= 0 && gameRunning) {
    gameOver();
  }
}

// 게임 오버
function gameOver() {
  gameRunning = false;
  gameOverDisplay.style.display = "block";
}

// 게임 재시작
function restartGame() {
  score = 0;
  player.energy = 100;
  player.size = 20;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  item = createItem();
  gameRunning = true;
  gameOverDisplay.style.display = "none";
  gameLoop();
}

// 그리기 함수
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 배경 그리기
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 플레이어 그리기
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();

  // 아이템 그리기
  ctx.fillStyle = COLORS.item;
  ctx.beginPath();
  ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
  ctx.fill();

  // 에너지바 그리기
  const barWidth = canvas.width * 0.6;
  const barHeight = 20;
  const barX = (canvas.width - barWidth) / 2;
  const barY = 10;

  // 에너지바 배경
  ctx.fillStyle = COLORS.energyBar.background;
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // 에너지 레벨
  ctx.fillStyle = COLORS.energyBar.fill;
  ctx.fillRect(barX, barY, barWidth * (player.energy / 100), barHeight);

  // 에너지바 테두리
  ctx.strokeStyle = COLORS.energyBar.border;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // 점수 표시
  ctx.fillStyle = COLORS.score;
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, barY + barHeight + 25);

  drawDirectionButtons();
}

// 게임 루프
function gameLoop() {
  if (!gameRunning) return;

  movePlayer();
  moveItem();
  checkCollision();
  defaultConsumeEnergy();
  draw();
  requestAnimationFrame(gameLoop);
}

// 게임 시작
function init() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  addEventListeners();
  setDirectionButtonsPosition();
  gameLoop();
}

init();
