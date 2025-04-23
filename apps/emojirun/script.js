const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const gameOverContent = document.getElementById("gameOverContent");
const finalScoreElement = document.getElementById("finalScore");
const highScoreDisplayElement = document.getElementById("highScoreDisplay");
const restartButton = document.getElementById("restartButton");

const GRAVITY = 0.6;
const JUMP_STRENGTH = -11;
const DOUBLE_JUMP_STRENGTH = -9;
const GROUND_Y = canvas.height - 60;
const PLAYER_SIZE = 40;
const OBSTACLE_BASE_SIZE = 35;
const DIFFICULTY_START_SCORE = 10;

let player = {
  emoji: "🏃",
  x: 50,
  y: GROUND_Y - PLAYER_SIZE,
  baseY: GROUND_Y - PLAYER_SIZE,
  width: PLAYER_SIZE * 0.8,
  height: PLAYER_SIZE * 0.9,
  baseHeight: PLAYER_SIZE * 0.9,
  velocityY: 0,
  jumpsLeft: 2,
  isJumpingVisual: false,
  squashFactor: 1,
};

const obstacleEmojis = ["🌵", "🌲", "🌳", "🗿", "🧱", "🍄"];
let obstacles = [];
let obstacleTimer = 0;
let baseNextObstacleInterval = 100;
let minNextObstacleInterval = 50;
let nextObstacleInterval = baseNextObstacleInterval;
let baseObstacleSpeed = 5.0;
let maxObstacleSpeed = 13;
let currentObstacleSpeed = baseObstacleSpeed;

let clouds = [];
const NUM_CLOUDS = 6;
const MIN_CLOUD_SPEED = 0.15;
const MAX_CLOUD_SPEED = 0.6;

let score = 0;
let highScore = localStorage.getItem("emojiRunHighScore") || 0;
let gameRunning = true;
let animationFrameId;
let difficultyIncreaseRate = 0.012;

function createCloud(initialX = null) {
  const y = Math.random() * (GROUND_Y * 0.5) + 30;
  const radiusX = 35 + Math.random() * 35;
  const radiusY = 12 + Math.random() * 12;
  const speed =
    MIN_CLOUD_SPEED + Math.random() * (MAX_CLOUD_SPEED - MIN_CLOUD_SPEED);
  const x = initialX !== null ? initialX : Math.random() * canvas.width;
  const parts = [];
  const numParts = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numParts; i++) {
    parts.push({
      offsetX: (Math.random() - 0.5) * radiusX * 1.3,
      offsetY: (Math.random() - 0.5) * radiusY * 0.6,
      partRadiusX: radiusX * (0.4 + Math.random() * 0.6),
      partRadiusY: radiusY * (0.5 + Math.random() * 0.5),
    });
  }
  return { x, y, speed, parts };
}

function initializeClouds() {
  clouds = [];
  for (let i = 0; i < NUM_CLOUDS; i++) {
    clouds.push(createCloud(Math.random() * canvas.width));
  }
}

function drawBackground() {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGradient.addColorStop(0, "#87CEEB");
  skyGradient.addColorStop(0.7, "#B0E0E6");
  skyGradient.addColorStop(1, "#ADD8E6");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, GROUND_Y);

  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  clouds.forEach((cloud) => {
    ctx.beginPath();
    cloud.parts.forEach((part) => {
      ctx.ellipse(
        cloud.x + part.offsetX,
        cloud.y + part.offsetY,
        part.partRadiusX,
        part.partRadiusY,
        0,
        0,
        Math.PI * 2
      );
    });
    ctx.fill();
  });

  const groundGradient = ctx.createLinearGradient(
    0,
    GROUND_Y,
    0,
    canvas.height
  );
  groundGradient.addColorStop(0, "#8B4513");
  groundGradient.addColorStop(1, "#A0522D");
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, GROUND_Y, canvas.width, 3);
}

function createObstacle() {
  const emoji =
    obstacleEmojis[Math.floor(Math.random() * obstacleEmojis.length)];
  const sizeVariation = (Math.random() - 0.3) * 15;
  const obstacleSize = OBSTACLE_BASE_SIZE + sizeVariation;
  const obstacleHeight = obstacleSize;
  const obstacleWidth = obstacleSize * 0.75;

  obstacles.push({
    emoji: emoji,
    x: canvas.width,
    y: GROUND_Y - obstacleHeight,
    width: obstacleWidth,
    height: obstacleHeight,
    size: obstacleSize,
    visualOffsetX: obstacleWidth * 0.1,
    visualOffsetY: 0,
  });

  let intervalDecrease = 0;
  if (score >= DIFFICULTY_START_SCORE) {
    intervalDecrease =
      (score - DIFFICULTY_START_SCORE) * difficultyIncreaseRate * 6;
  }
  nextObstacleInterval = baseNextObstacleInterval - intervalDecrease;
  nextObstacleInterval = Math.max(
    nextObstacleInterval,
    minNextObstacleInterval
  );
  nextObstacleInterval += (Math.random() - 0.5) * 20;
  nextObstacleInterval = Math.max(
    nextObstacleInterval,
    minNextObstacleInterval
  );
}

function checkCollision(rect1, rect2) {
  const padding = 2;
  return (
    rect1.x + padding < rect2.x + rect2.width - padding &&
    rect1.x + rect1.width - padding > rect2.x + padding &&
    rect1.y + padding < rect2.y + rect2.height - padding &&
    rect1.y + rect1.height - padding > rect2.y + padding
  );
}

function drawFlippedPlayer(playerState) {
  ctx.save();

  let emojiToDraw = playerState.emoji;
  let playerDrawHeight = PLAYER_SIZE / playerState.squashFactor;
  let playerDrawYOffset = PLAYER_SIZE - playerDrawHeight;

  let flipCenterX = playerState.x + playerState.width / 2;
  let drawY = playerState.y + playerState.height + playerDrawYOffset;

  ctx.translate(flipCenterX, 0);
  ctx.scale(-1, 1);

  ctx.font = `${playerDrawHeight}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#000000";
  ctx.fillText(emojiToDraw, 0, drawY);

  ctx.restore();
}

function update() {
  if (!gameRunning) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  clouds.forEach((cloud, index) => {
    cloud.x -= cloud.speed;
    let maxRightX = 0;
    cloud.parts.forEach(
      (part) =>
        (maxRightX = Math.max(maxRightX, part.offsetX + part.partRadiusX))
    );
    if (cloud.x + maxRightX < 0) {
      clouds[index] = createCloud(canvas.width + Math.random() * 150);
    }
  });

  drawBackground();

  player.velocityY += GRAVITY;
  player.y += player.velocityY;
  player.isJumpingVisual = true;

  const maxSquash = 1.15;
  const maxStretch = 1.1;
  const squashSensitivity = 25;
  const stretchSensitivity = Math.abs(JUMP_STRENGTH * 1.5);

  if (player.velocityY < -0.5) {
    player.squashFactor =
      1 + (Math.abs(player.velocityY) / stretchSensitivity) * (maxStretch - 1);
    player.squashFactor = Math.min(player.squashFactor, maxStretch);
  } else if (player.velocityY > 0.5) {
    player.squashFactor =
      1 / (1 + (player.velocityY / squashSensitivity) * (maxSquash - 1));
    player.squashFactor = Math.max(player.squashFactor, 1 / maxSquash);
  } else {
    player.squashFactor += (1 - player.squashFactor) * 0.2;
  }

  if (player.y + player.height > GROUND_Y) {
    player.y = GROUND_Y - player.height;
    player.velocityY = 0;
    if (player.jumpsLeft < 2) {
      player.jumpsLeft = 2;
    }
    player.isJumpingVisual = false;
    if (player.squashFactor < 0.9) {
      player.squashFactor += (1 - player.squashFactor) * 0.15;
    } else {
      player.squashFactor = 0.85;
    }
  }

  drawFlippedPlayer(player);

  obstacleTimer++;
  if (obstacleTimer > nextObstacleInterval) {
    createObstacle();
    obstacleTimer = 0;
  }

  let speedIncrease = 0;
  if (score >= DIFFICULTY_START_SCORE) {
    speedIncrease = (score - DIFFICULTY_START_SCORE) * difficultyIncreaseRate;
  }
  currentObstacleSpeed = baseObstacleSpeed + speedIncrease;
  currentObstacleSpeed = Math.min(currentObstacleSpeed, maxObstacleSpeed);

  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.x -= currentObstacleSpeed;

    ctx.font = `${obs.size}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#000000";
    ctx.fillText(obs.emoji, obs.x, obs.y + obs.height);

    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
      score++;
      scoreElement.textContent = `점수: ${score}`;
    }

    if (checkCollision(player, obs)) {
      gameRunning = false;
      player.emoji = "😵";
      shakeScreen(5);
      showGameOver();
      cancelAnimationFrame(animationFrameId);
      return;
    }
  }

  animationFrameId = requestAnimationFrame(update);
}

function showGameOver() {
  finalScoreElement.textContent = `최종 점수: ${score}`;

  if (score > parseInt(highScore)) {
    highScore = score;
    localStorage.setItem("emojiRunHighScore", highScore);
    highScoreDisplayElement.textContent = `🎉 최고 기록 달성! ${highScore}`;
    highScoreDisplayElement.style.color = "#e67e22";
  } else {
    highScoreDisplayElement.textContent = `최고 점수: ${highScore}`;
    highScoreDisplayElement.style.color = "#333";
  }

  gameOverOverlay.classList.remove("hidden");
  setTimeout(() => {
    gameOverOverlay.classList.add("visible");
  }, 10);
}

function restartGame() {
  player.y = GROUND_Y - player.height;
  player.baseY = GROUND_Y - player.height;
  player.velocityY = 0;
  player.jumpsLeft = 2;
  player.emoji = "🏃";
  player.squashFactor = 1;
  obstacles = [];
  score = 0;
  obstacleTimer = 0;
  currentObstacleSpeed = baseObstacleSpeed;
  nextObstacleInterval = baseNextObstacleInterval;
  gameRunning = true;

  scoreElement.textContent = `점수: ${score}`;
  gameOverOverlay.classList.remove("visible");
  setTimeout(() => {
    gameOverOverlay.classList.add("hidden");
  }, 300);

  initializeClouds();

  cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(update);
}

function handleKeyDown(e) {
  if (!gameRunning) {
    return;
  }

  if ((e.code === "Space" || e.code === "ArrowUp") && player.jumpsLeft > 0) {
    jump();
  }
}

function handleTouchStart(e) {
  e.preventDefault();

  if (!gameRunning) {
    return;
  }

  if (player.jumpsLeft > 0) {
    jump();
  }
}

function jump() {
  if (player.jumpsLeft === 2) {
    player.velocityY = JUMP_STRENGTH;
  } else {
    player.velocityY = DOUBLE_JUMP_STRENGTH;
  }
  player.jumpsLeft--;
  player.squashFactor = 1 / 1.1;
}

function shakeScreen(intensity) {
  const gameContainer = document.querySelector(".game-container");
  gameContainer.style.transition = "transform 0.05s ease-in-out";
  let shakeCount = 0;
  const intervalId = setInterval(() => {
    const x = (Math.random() - 0.5) * intensity;
    const y = (Math.random() - 0.5) * intensity;
    gameContainer.style.transform = `translate(${x}px, ${y}px)`;
    shakeCount++;
    if (shakeCount >= 5) {
      clearInterval(intervalId);
      gameContainer.style.transform = "translate(0, 0)";
    }
  }, 50);
}

document.addEventListener("keydown", handleKeyDown);
const gameContainer = document.querySelector(".game-container");
if (gameContainer) {
  gameContainer.addEventListener("touchstart", handleTouchStart, {
    passive: false,
  });
} else {
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
}
restartButton.addEventListener("click", restartGame);
restartButton.addEventListener("touchstart", (e) => {
  e.preventDefault();
  restartGame();
});

initializeClouds();
highScore = parseInt(localStorage.getItem("emojiRunHighScore") || "0");
animationFrameId = requestAnimationFrame(update);
