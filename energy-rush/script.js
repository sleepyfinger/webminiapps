// DOM 요소 선택
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameOverDisplay = document.getElementById("gameOver");
const restartButton = document.getElementById("restartButton");
const upButton = document.getElementById("upButton");
const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");
const downButton = document.getElementById("downButton");
const fullscreenButton = document.getElementById("fullscreenButton"); // 풀스크린 버튼

// 게임 상태 변수
let score = 0;
let gameRunning = true;

// 플레이어 객체
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 20,
  color: "blue",
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

// 게임 초기화 및 시작
function init() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  addEventListeners();
  gameLoop();
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

  // 방향 버튼 마우스 이벤트
  [
    [upButton, "ArrowUp"],
    [leftButton, "ArrowLeft"],
    [rightButton, "ArrowRight"],
    [downButton, "ArrowDown"],
  ].forEach(([button, key]) => {
    button.addEventListener("mousedown", () => (keys[key] = true));
    button.addEventListener("mouseup", () => (keys[key] = false));
  });

  // 방향 버튼 터치 이벤트
  [
    [upButton, "ArrowUp"],
    [leftButton, "ArrowLeft"],
    [rightButton, "ArrowRight"],
    [downButton, "ArrowDown"],
  ].forEach(([button, key]) => {
    button.addEventListener("touchstart", (e) => {
      e.preventDefault();
      keys[key] = true;
    });
    button.addEventListener("touchend", () => (keys[key] = false));
  });

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
    color: "red",
    speedX: (Math.random() - 0.5) * 4, // -2에서 2 사이의 랜덤 속도
    speedY: (Math.random() - 0.5) * 4,
  };
}

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

// 플레이어 이동
function movePlayer() {
  if (player.energy > 0) {
    if (keys.ArrowUp && player.y > player.size) player.y -= player.speed;
    if (keys.ArrowDown && player.y < canvas.height - player.size)
      player.y += player.speed;
    if (keys.ArrowLeft && player.x > player.size) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.size)
      player.x += player.speed;
  }
}

// 충돌 감지
function checkCollision() {
  const dx = player.x - item.x;
  const dy = player.y - item.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < player.size + item.size) {
    item = createItem();
    player.size += 2;
    player.energy = Math.min(player.energy + 10, 100);
    score += 10;
  }
}

// 에너지 소모
function consumeEnergy() {
  player.energy = Math.max(player.energy - 0.15, 0);
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

  // 플레이어 그리기
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();

  // 아이템 그리기
  ctx.fillStyle = item.color;
  ctx.beginPath();
  ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
  ctx.fill();

  // 에너지바 그리기
  const barWidth = canvas.width * 0.6; // 캔버스 너비의 60%
  const barHeight = 20;
  const barX = (canvas.width - barWidth) / 2;
  const barY = 10; // 상단에서 10px 아래

  // 에너지바 배경
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // 에너지 레벨
  ctx.fillStyle = "green";
  ctx.fillRect(barX, barY, barWidth * (player.energy / 100), barHeight);

  // 에너지바 테두리
  ctx.strokeStyle = "white";
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // 점수 표시
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, barY + barHeight + 25);
}

// 게임 루프
function gameLoop() {
  if (!gameRunning) return;

  movePlayer();
  moveItem(); // 아이템 이동 함수 호출
  checkCollision();
  consumeEnergy();
  draw();

  requestAnimationFrame(gameLoop);
}

// 게임 시작
init();
