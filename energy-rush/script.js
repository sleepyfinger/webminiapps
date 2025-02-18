// DOM 요소
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const gameOverDisplay = document.getElementById("gameOver");
const restartButton = document.getElementById("restartButton");
const energyFill = document.getElementById("energyFill");

// 게임 상태
let score = 0;
let gameRunning = true;

// 게임 객체
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 20,
  color: "blue",
  speed: 5,
  energy: 100,
};

let item = createItem();

// 키 입력 상태
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

// 초기화
function init() {
  canvas.width = window.innerWidth * 0.8;
  canvas.height = window.innerHeight * 0.8;
  addEventListeners();
  gameLoop();
}

// 이벤트 리스너 추가
function addEventListeners() {
  window.addEventListener("keydown", (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
  });
  window.addEventListener("keyup", (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
  });
  restartButton.addEventListener("click", restartGame);
}

// 아이템 생성
function createItem() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 10,
    color: "red",
  };
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
    updateScore();
  }
}

// 에너지 소모
function consumeEnergy() {
  player.energy = Math.max(player.energy - 0.2, 0);
  updateEnergyBar();
  if (player.energy <= 0 && gameRunning) {
    gameOver();
  }
}

// 점수 업데이트
function updateScore() {
  scoreDisplay.textContent = score;
}

// 에너지 바 업데이트
function updateEnergyBar() {
  energyFill.style.width = `${player.energy}%`;
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
  updateScore();
  updateEnergyBar();
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
}

// 게임 루프
function gameLoop() {
  if (!gameRunning) return;

  movePlayer();
  checkCollision();
  consumeEnergy();
  draw();

  requestAnimationFrame(gameLoop);
}

// 게임 시작
init();
