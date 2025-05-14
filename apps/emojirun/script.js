const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const uiContainer = document.getElementById("ui-container");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const gameOverContent = document.getElementById("gameOverContent");
const finalScoreElement = document.getElementById("finalScore");
const highScoreDisplayElement = document.getElementById("highScoreDisplay");
const inGameHighScoreDisplayElement = document.getElementById(
  "inGameHighScoreDisplay"
);
const restartButton = document.getElementById("restartButton");
const startScreenOverlay = document.getElementById("startScreenOverlay");
const startGameButton = document.getElementById("startGameButton");

const bgm = document.getElementById("bgm");
const soundToggleBtn = document.getElementById("soundToggleBtn");
let isMuted = localStorage.getItem("emojiRunMuted") === "true" || false;

const jumpSound = new Audio("assets/sounds/jump.mp3");
const gameOverSound = new Audio("assets/sounds/gameOver.mp3");
const powerUpSound = new Audio("assets/sounds/powerUp.mp3");
const scoreMultiplierSound = new Audio("assets/sounds/score_multiplier.mp3");
const landSound = new Audio("assets/sounds/land.mp3");
const slowMotionSound = new Audio("assets/sounds/slow_motion.mp3");
const clickSound = new Audio("assets/sounds/click.mp3");

const GRAVITY = 0.6;
const JUMP_STRENGTH = -11;
const DOUBLE_JUMP_STRENGTH = -9;
const GROUND_Y = canvas.height - 60;
const PLAYER_SIZE = 40;
const OBSTACLE_BASE_SIZE = 35;
const DIFFICULTY_START_SCORE = 10;

let player = {
  emoji: "🏃",
  originalEmoji: "🏃",
  duckingEmoji: "🧎",
  isDucking: false,
  x: 50,
  y: GROUND_Y - PLAYER_SIZE,
  baseY: GROUND_Y - PLAYER_SIZE,
  width: PLAYER_SIZE * 0.8,
  height: PLAYER_SIZE * 0.9,
  baseHeight: PLAYER_SIZE * 0.9,
  velocityY: 0,
  originalHeight: PLAYER_SIZE * 0.9, // Store original height
  duckingHeight: PLAYER_SIZE * 0.45, // Height when ducking
  jumpsLeft: 2,
  isJumpingVisual: false,
  squashFactor: 1,
  isInvincible: false,
  invincibilityTimer: 0,
  isScoreDoubled: false,
  scoreMultiplierTimer: 0,
  isSlowMotionActive: false,
  slowMotionTimer: 0,
};

const SCORE_MULTIPLIER_EMOJI = "💰";
const SLOW_MOTION_EMOJI = "⏳";
const groundObstacleEmojis = ["🌵", "🌲", "🌳", "🗿", "🧱", "🍄"];
const flyingObstacleEmojis = ["🦅", "🦇"];
let obstacles = [];
let obstacleTimer = 0;
let baseNextObstacleInterval = 100;
let minNextObstacleInterval = 50;
let nextObstacleInterval = baseNextObstacleInterval;
let baseObstacleSpeed = 5.0;
let maxObstacleSpeed = 13;
let currentObstacleSpeed = baseObstacleSpeed;

const TARGET_FPS = 60;
const TARGET_FRAME_INTERVAL = 1000 / TARGET_FPS;

let powerUps = [];
const POWER_UP_EMOJI = "🌟";
const POWER_UP_SIZE = PLAYER_SIZE * 0.7;
const SCORE_MULTIPLIER_DURATION = 240; // 60FPS에서 4초
const SLOW_MOTION_DURATION = 180; // 60FPS에서 3초
const SLOW_MOTION_FACTOR = 0.5; // 게임 속도 50%
const POWER_UP_DURATION = 300;
let powerUpSpawnTimer = 0;
let nextPowerUpInterval = TARGET_FPS * (10 + Math.random() * 10); // 첫 파워업 등장 간격도 10~20초로 설정

let clouds = [];
const NUM_CLOUDS = 6;
const MIN_CLOUD_SPEED = 0.15;
const MAX_CLOUD_SPEED = 0.6;

let score = 0;
let highScore = localStorage.getItem("emojiRunHighScore") || 0;
let gameRunning = false;
let animationFrameId;
let difficultyIncreaseRate = 0.012;
let lastTimestamp = 0;

function playSfx(soundElement) {
  if (!isMuted) {
    soundElement.currentTime = 0;
    soundElement
      .play()
      .catch((e) => console.warn(`SFX play error (${soundElement.src}):`, e));
  }
}

function updateSoundControls() {
  if (isMuted) {
    bgm.pause();
    soundToggleBtn.textContent = "🔇";
  } else {
    soundToggleBtn.textContent = "🔊";
    if (gameRunning) {
      bgm.play().catch((e) => console.warn("BGM play error on unmute:", e));
    }
  }
}

function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem("emojiRunMuted", String(isMuted));
  updateSoundControls();
}

function updateScoreDisplay() {
  let scorePrefix = "🎯";
  if (player.isSlowMotionActive) {
    scorePrefix += ` ${SLOW_MOTION_EMOJI}`;
  }
  if (player.isScoreDoubled) {
    scorePrefix += ` 2X`;
    scoreElement.textContent = `${scorePrefix}: ${score}`;
    scoreElement.style.color = "orange";
  } else {
    scoreElement.textContent = `${scorePrefix} ${score}`;
    scoreElement.style.color = "#333"; // 기본 색상으로 복원
  }
}

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
  const sizeVariation = (Math.random() - 0.3) * 15;
  const obstacleSize = OBSTACLE_BASE_SIZE + sizeVariation;
  let obstacleHeight = obstacleSize;
  const obstacleWidth = obstacleSize * 0.75;
  let emoji;
  let obsY;

  let flyingChance = 0;
  if (score > 15) {
    flyingChance = 0.1 + score / 400;
  }
  flyingChance = Math.min(flyingChance, 0.5);
  const isFlyingObstacle = Math.random() < flyingChance;

  if (isFlyingObstacle) {
    emoji =
      flyingObstacleEmojis[
        Math.floor(Math.random() * flyingObstacleEmojis.length)
      ];
    obstacleHeight *= 0.8; // Flying obstacles might be slightly smaller visually
    // Positioned so player must duck. Bottom of obstacle is above player's ducking height but below standing height.
    obsY = GROUND_Y - player.originalHeight * 0.85 - obstacleHeight;
  } else {
    emoji =
      groundObstacleEmojis[
        Math.floor(Math.random() * groundObstacleEmojis.length)
      ];
    obsY = GROUND_Y - obstacleHeight;
  }

  obstacles.push({
    emoji: emoji,
    x: canvas.width,
    y: obsY,
    width: obstacleWidth,
    height: obstacleHeight,
    size: obstacleSize,
    isFlying: isFlyingObstacle,
  });

  let currentMinObstacleInterval = minNextObstacleInterval;
  if (score > 50) {
    currentMinObstacleInterval = minNextObstacleInterval - (score - 50) / 15;
  }
  currentMinObstacleInterval = Math.max(currentMinObstacleInterval, 30);

  let intervalDecrease = 0;
  if (score >= DIFFICULTY_START_SCORE) {
    intervalDecrease =
      (score - DIFFICULTY_START_SCORE) * difficultyIncreaseRate * 6;
  }
  nextObstacleInterval = baseNextObstacleInterval - intervalDecrease;
  nextObstacleInterval = Math.max(
    nextObstacleInterval,
    currentMinObstacleInterval
  );
  nextObstacleInterval += (Math.random() - 0.5) * 20;
  nextObstacleInterval = Math.max(
    nextObstacleInterval,
    currentMinObstacleInterval
  );
}

function createPowerUp() {
  const powerUpY =
    GROUND_Y - PLAYER_SIZE - Math.random() * PLAYER_SIZE * 1.5 - POWER_UP_SIZE;

  let powerUpType;
  let powerUpEmoji;
  const rand = Math.random();
  if (rand < 0.4) {
    // 40% 확률 무적
    powerUpType = "invincibility";
    powerUpEmoji = POWER_UP_EMOJI;
  } else if (rand < 0.7) {
    // 30% 확률 점수 2배 (0.4 ~ 0.699...)
    powerUpType = "score_multiplier";
    powerUpEmoji = SCORE_MULTIPLIER_EMOJI;
  } else {
    // 30% 확률 슬로우 모션
    powerUpType = "slow_motion";
    powerUpEmoji = SLOW_MOTION_EMOJI;
  }

  powerUps.push({
    emoji: powerUpEmoji,
    x: canvas.width,
    y: powerUpY,
    width: POWER_UP_SIZE,
    height: POWER_UP_SIZE,
    size: POWER_UP_SIZE,
    type: powerUpType,
  });
}

function checkCollision(rect1, rect2) {
  // rect1 is assumed to be the player object (or any object with x, y, width, height)
  // rect2 is the other object (obstacle or power-up)

  // The player object (rect1) should have its y and height properties
  // correctly updated to reflect ducking status *before* this function is called.
  // The main update loop handles this.

  const padding = 2;
  return (
    rect1.x + padding < rect2.x + rect2.width - padding &&
    rect1.x + rect1.width - padding > rect2.x + padding &&
    rect1.y + padding < rect2.y + rect2.height - padding && // These lines correctly use rect1's current y and height
    rect1.y + rect1.height - padding > rect2.y + padding // which are updated for ducking in the main loop.
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

  if (playerState.isInvincible) {
    ctx.shadowColor = "gold";
    ctx.shadowBlur = 20;
  }

  ctx.font = `${playerDrawHeight}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#000000";
  ctx.fillText(emojiToDraw, 0, drawY);

  if (playerState.isInvincible) {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function update(currentTimestamp) {
  animationFrameId = requestAnimationFrame(update);

  if (!lastTimestamp) {
    lastTimestamp = currentTimestamp;
  }
  const elapsedTime = currentTimestamp - lastTimestamp;

  if (elapsedTime < TARGET_FRAME_INTERVAL) {
    return;
  }
  lastTimestamp = currentTimestamp - (elapsedTime % TARGET_FRAME_INTERVAL);

  if (!gameRunning) {
    return;
  }

  let effectiveSpeedFactor = 1;
  if (player.isSlowMotionActive) {
    effectiveSpeedFactor = SLOW_MOTION_FACTOR;
  }
  const gameDisplaySpeed = currentObstacleSpeed * effectiveSpeedFactor;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  powerUpSpawnTimer++;
  if (
    powerUps.length === 0 &&
    powerUpSpawnTimer > nextPowerUpInterval &&
    obstacles.length >= 2 // 장애물이 2개 이상일 때부터 파워업 등장 가능
  ) {
    const lastObstacle = obstacles[obstacles.length - 1];
    if (!lastObstacle || canvas.width - lastObstacle.x > PLAYER_SIZE * 5) {
      createPowerUp();
      powerUpSpawnTimer = 0;
      nextPowerUpInterval = TARGET_FPS * (10 + Math.random() * 10);
    }
  }

  clouds.forEach((cloud, index) => {
    cloud.x -= cloud.speed * effectiveSpeedFactor;
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

  if (player.isInvincible) {
    player.invincibilityTimer--;
    if (player.invincibilityTimer <= 0) {
      player.isInvincible = false;
      player.emoji = player.originalEmoji;
    }
  }

  if (player.isScoreDoubled) {
    player.scoreMultiplierTimer--;
    if (player.scoreMultiplierTimer <= 0) {
      player.isScoreDoubled = false;
      updateScoreDisplay();
    }
  }

  if (player.isSlowMotionActive) {
    player.slowMotionTimer--;
    if (player.slowMotionTimer <= 0) {
      player.isSlowMotionActive = false;
      updateScoreDisplay(); // 점수 표시 업데이트
    }
  }

  // Player ducking logic
  if (player.isDucking) {
    if (player.y + player.height < GROUND_Y) {
      // if in air, stop ducking
      player.isDucking = false;
      player.emoji = player.originalEmoji;
      player.height = player.originalHeight;
      // No y adjustment here, gravity will bring player down
    } else {
      // on ground, remain ducking
      player.emoji = player.duckingEmoji;
      player.height = player.duckingHeight;
      player.y = GROUND_Y - player.duckingHeight;
    }
  }

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
    player.y =
      GROUND_Y -
      (player.isDucking ? player.duckingHeight : player.originalHeight);
    player.height = player.isDucking
      ? player.duckingHeight
      : player.originalHeight;
    player.velocityY = 0;
    if (player.velocityY > 1 && player.jumpsLeft < 2) {
      // 착지 조건 수정
      playSfx(landSound);
    }
    if (player.jumpsLeft < 2) {
      player.jumpsLeft = 2;
      // player.isDucking = false; // Landing cancels duck? Or not? Let's not cancel for now.
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
    obs.x -= gameDisplaySpeed;

    ctx.font = `${obs.size}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#000000";
    ctx.fillText(obs.emoji, obs.x, obs.y + obs.height);

    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
      score++;
      if (player.isScoreDoubled) {
        score++; // 한 번 더 추가해서 2배 효과
      }
      updateScoreDisplay();
    }

    if (checkCollision(player, obs)) {
      if (player.isInvincible) {
        obstacles.splice(i, 1);
        score++;
        if (player.isScoreDoubled) {
          score++; // 무적 상태에서 장애물 제거 시에도 2배 적용
        }
        updateScoreDisplay();
      } else {
        gameRunning = false;
        player.emoji = "😵";
        shakeScreen(5);
        showGameOver();
        cancelAnimationFrame(animationFrameId);
        return;
      }
    }
  }

  for (let i = powerUps.length - 1; i >= 0; i--) {
    let pu = powerUps[i];
    pu.x -= gameDisplaySpeed;
    ctx.font = `${pu.size}px sans-serif`;
    ctx.textAlign = "left"; // 파워업을 그릴 때 textAlign을 명시적으로 설정합니다.
    ctx.textBaseline = "alphabetic"; // 장애물과 일관성을 위해 설정합니다.
    ctx.fillStyle = "#000000"; // 장애물과 일관성을 위해 설정합니다.
    ctx.fillText(pu.emoji, pu.x, pu.y + pu.height);

    if (checkCollision(player, pu)) {
      activatePowerUp(pu.type, pu.emoji); // 파워업 타입과 이모지 전달
      powerUps.splice(i, 1);
    } else if (pu.x + pu.width < 0) {
      powerUps.splice(i, 1);
    }
  }
}

function showGameOver() {
  finalScoreElement.textContent = `최종 점수: ${score}`;
  gameOverSound.currentTime = 0;
  playSfx(gameOverSound);

  if (score > parseInt(highScore)) {
    highScore = score;
    localStorage.setItem("emojiRunHighScore", highScore);
    highScoreDisplayElement.textContent = `🎉 최고 기록 달성! ${highScore}`;
    highScoreDisplayElement.style.color = "orange"; // 이 부분은 게임오버 화면의 최고 점수
    inGameHighScoreDisplayElement.textContent = `🏆 ${highScore}`; // 인게임 UI의 최고 점수
  } else {
    highScoreDisplayElement.textContent = `최고 점수: ${highScore}`;
    highScoreDisplayElement.style.color = "#333";
  }

  gameOverOverlay.classList.remove("hidden");
  setTimeout(() => {
    gameOverOverlay.classList.add("visible");
  }, 10);
}

function activatePowerUp(type, emoji) {
  if (type === "invincibility") {
    player.isInvincible = true;
    player.invincibilityTimer = POWER_UP_DURATION;
    player.emoji = "🤩";
    playSfx(powerUpSound); // 기존 파워업 사운드
  } else if (type === "score_multiplier") {
    player.isScoreDoubled = true;
    player.scoreMultiplierTimer = SCORE_MULTIPLIER_DURATION;
    playSfx(scoreMultiplierSound); // 점수 2배 파워업 사운드
    updateScoreDisplay(); // 즉시 점수 표시 업데이트
  } else if (type === "slow_motion") {
    player.isSlowMotionActive = true;
    player.slowMotionTimer = SLOW_MOTION_DURATION;
    playSfx(slowMotionSound);
    updateScoreDisplay(); // 즉시 점수 표시 업데이트
  }
}

function actualStartGameLogic() {
  player.y = GROUND_Y - player.height;
  player.baseY = GROUND_Y - player.height;
  player.velocityY = 0;
  player.jumpsLeft = 2;
  player.emoji = player.originalEmoji;
  player.squashFactor = 1;
  player.isDucking = false; // Reset ducking state
  player.height = player.originalHeight; // Reset height
  // Ensure y is correct for standing height
  player.y = GROUND_Y - player.originalHeight;

  player.isScoreDoubled = false;
  player.scoreMultiplierTimer = 0;
  player.isSlowMotionActive = false;
  player.slowMotionTimer = 0;
  player.isInvincible = false;
  player.invincibilityTimer = 0;
  obstacles = [];
  powerUps = [];
  score = 0;
  obstacleTimer = 0;
  currentObstacleSpeed = baseObstacleSpeed;
  nextObstacleInterval = baseNextObstacleInterval;

  updateScoreDisplay(); // 점수 표시 초기화
  inGameHighScoreDisplayElement.textContent = `🏆 ${highScore}`;
  initializeClouds();
  lastTimestamp = 0;
  gameRunning = true;

  if (!isMuted && bgm) {
    bgm
      .play()
      .catch((e) => console.warn("BGM play error in actualStartGameLogic:", e));
  }

  cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(update);
}

function startGame() {
  if (gameRunning && startScreenOverlay.classList.contains("hidden")) {
    return;
  }

  startScreenOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  gameOverOverlay.classList.remove("visible");

  gameCanvas.classList.remove("hidden");
  uiContainer.classList.remove("hidden");

  actualStartGameLogic();
}

function restartGame() {
  gameRunning = true;

  updateScoreDisplay();
  inGameHighScoreDisplayElement.textContent = `🏆 ${highScore}`;
  gameOverOverlay.classList.remove("visible");
  setTimeout(() => {
    gameOverOverlay.classList.add("hidden");
    actualStartGameLogic();
  }, 300);
}

function handleKeyDown(e) {
  if (!gameRunning) {
    return;
  }

  if (e.code === "Space" || e.code === "ArrowUp") {
    if (player.jumpsLeft > 0 && !player.isDucking) {
      // Can only jump if not ducking
      jump();
    }
  } else if (e.code === "ArrowDown") {
    if (player.y + player.height >= GROUND_Y - 1) {
      // Can only duck if on/near ground
      if (!player.isDucking) {
        player.isDucking = true;
        // Visuals/state change handled in update loop
      }
    }
  }
}

function handleKeyUp(e) {
  if (!gameRunning) {
    return;
  }
  if (e.code === "ArrowDown") {
    if (player.isDucking) {
      player.isDucking = false;
      player.emoji = player.originalEmoji;
      player.height = player.originalHeight;
      player.y = GROUND_Y - player.originalHeight; // Adjust Y pos immediately
    }
  }
}

function handleTouchStart(e) {
  e.preventDefault();
  if (!gameRunning) {
    return;
  }

  if (player.jumpsLeft > 0 && !player.isDucking) {
    // Can only jump if not ducking
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
  jumpSound.currentTime = 0;
  playSfx(jumpSound);
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

function initialScreenActivation(e) {
  if (gameRunning || startScreenOverlay.classList.contains("hidden")) {
    return;
  }

  if (e.type === "keydown" && e.key === "Enter") {
    startGame();
  } else if (e.type === "click" || e.type === "touchstart") {
    if (
      e.target === startScreenOverlay ||
      (e.target.closest("#startScreenContent") &&
        e.target !== startGameButton &&
        !startGameButton.contains(e.target))
    ) {
      if (e.type === "touchstart") e.preventDefault();
      startGame();
    }
  }
}

document.addEventListener("keydown", initialScreenActivation);
startScreenOverlay.addEventListener("click", initialScreenActivation);
startScreenOverlay.addEventListener("touchstart", initialScreenActivation, {
  passive: false,
});

startGameButton.addEventListener("click", () => {
  clickSound.currentTime = 0;
  playSfx(clickSound);
  startGame();
});
startGameButton.addEventListener("touchstart", (e) => {
  e.preventDefault();
  clickSound.currentTime = 0;
  playSfx(clickSound);
  startGame();
});

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp); // Add keyup listener for ducking
const gameContainer = document.querySelector(".game-container");
if (gameContainer) {
  gameContainer.addEventListener("touchstart", handleTouchStart, {
    passive: false,
  });
} else {
  canvas.addEventListener("touchstart", handleTouchStart, {
    passive: false,
  });
}
restartButton.addEventListener("click", () => {
  clickSound.currentTime = 0;
  playSfx(clickSound);
  restartGame();
});
restartButton.addEventListener("touchstart", (e) => {
  e.preventDefault();
  clickSound.currentTime = 0;
  playSfx(clickSound);
  restartGame();
});

initializeClouds();
highScore = parseInt(localStorage.getItem("emojiRunHighScore") || "0");
inGameHighScoreDisplayElement.textContent = `🏆 ${highScore}`;

if (soundToggleBtn) {
  soundToggleBtn.addEventListener("click", toggleMute);
  updateSoundControls();
}
