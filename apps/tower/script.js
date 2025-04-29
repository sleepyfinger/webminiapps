const menuContainer = document.getElementById("menu-container");
const startButton = document.getElementById("startButton");
const helpButton = document.getElementById("helpButton");

const gameContainer = document.getElementById("game-container");
const canvas = document.getElementById("gameCanvas");
const scoreElement = document.getElementById("score");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreElement = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");
const mainMenuButton = document.getElementById("mainMenuButton");

const helpPopup = document.getElementById("helpPopup");
const closeHelpPopup = document.getElementById("closeHelpPopup");

const ctx = canvas ? canvas.getContext("2d") : null;

const BLOCK_HEIGHT = 20;
const INITIAL_BLOCK_WIDTH = canvas ? canvas.width * 0.4 : 100;
const INITIAL_SPEED = 2;

let stack = [];
let currentBlock = null;
let score = 0;
let gamePhase = "menu";
let animationFrameId = null;
let currentSpeed = INITIAL_SPEED;
let direction = 1;

function getRandomColor() {
  const h =
    Math.random() < 0.6 ? Math.random() * 70 + 170 : Math.random() * 60 + 300;
  const s = 85 + Math.random() * 15;
  const l = 65 + Math.random() * 10;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function drawBlock(block) {
  if (!ctx) return;
  ctx.fillStyle = block.color;
  ctx.fillRect(block.x, block.y, block.width, BLOCK_HEIGHT);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    block.x + 0.5,
    block.y + 0.5,
    block.width - 1,
    BLOCK_HEIGHT - 1
  );
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(block.x, block.y + BLOCK_HEIGHT - 2, block.width, 2);
}

function updateScore() {
  if (scoreElement) {
    scoreElement.textContent = `SCORE: ${score}`;
  }
}

function switchScreen(screenToShow) {
  if (menuContainer) menuContainer.style.display = "none";
  if (gameContainer) gameContainer.style.display = "none";

  if (screenToShow === "menu" && menuContainer) {
    menuContainer.style.display = "flex";
  } else if (screenToShow === "game" && gameContainer) {
    gameContainer.style.display = "flex";
  }
}

function resetGame() {
  if (!ctx) {
    console.error("Canvas context not found. Cannot reset game.");
    return;
  }
  cancelAnimationFrame(animationFrameId);
  stack = [];
  currentBlock = null;
  score = 0;
  currentSpeed = INITIAL_SPEED;
  direction = 1;
  updateScore();
  if (gameOverScreen) gameOverScreen.style.display = "none";

  const baseWidth = canvas.width * 0.7;
  const baseX = (canvas.width - baseWidth) / 2;
  const baseY = canvas.height - BLOCK_HEIGHT;
  stack.push({ x: baseX, y: baseY, width: baseWidth, color: "#3a4a7a" });

  spawnNewBlock();

  gamePhase = "playing";
  gameLoop();
}

function spawnNewBlock() {
  if (stack.length === 0 || !ctx) return;

  const previousBlock = stack[stack.length - 1];
  const newY = previousBlock.y - BLOCK_HEIGHT;

  currentBlock = {
    x: Math.random() < 0.5 ? 0 : canvas.width - previousBlock.width,
    y: newY,
    width: previousBlock.width,
    color: getRandomColor(),
  };
  direction = currentBlock.x === 0 ? 1 : -1;
  currentSpeed += 0.035;
}

function placeBlock() {
  if (!currentBlock || gamePhase !== "playing" || stack.length === 0 || !ctx)
    return;

  const previousBlock = stack[stack.length - 1];

  const overlapStart = Math.max(currentBlock.x, previousBlock.x);
  const overlapEnd = Math.min(
    currentBlock.x + currentBlock.width,
    previousBlock.x + previousBlock.width
  );
  const overlapWidth = overlapEnd - overlapStart;

  if (overlapWidth <= 1) {
    gameOver();
    return;
  }

  const placedBlock = {
    x: overlapStart,
    y: currentBlock.y,
    width: overlapWidth,
    color: currentBlock.color,
  };

  stack.push(placedBlock);
  score++;
  updateScore();

  const stackTopY = placedBlock.y;
  const cameraThreshold = canvas.height * 0.55;

  if (stackTopY < cameraThreshold) {
    const shiftAmount = BLOCK_HEIGHT;
    stack.forEach((block) => {
      block.y += shiftAmount;
    });
  }

  spawnNewBlock();
  if (currentBlock) {
    currentBlock.width = placedBlock.width;
  }
}

function gameOver() {
  gamePhase = "gameOver";
  cancelAnimationFrame(animationFrameId);
  if (finalScoreElement) finalScoreElement.textContent = score;
  if (gameOverScreen) gameOverScreen.style.display = "flex";
}

function gameLoop() {
  if (gamePhase !== "playing" || !ctx) return;

  if (currentBlock) {
    currentBlock.x += direction * currentSpeed;
    if (currentBlock.x <= 0) {
      currentBlock.x = 0;
      direction = 1;
    } else if (currentBlock.x + currentBlock.width >= canvas.width) {
      currentBlock.x = canvas.width - currentBlock.width;
      direction = -1;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < stack.length; i++) {
    drawBlock(stack[i]);
  }
  if (currentBlock) {
    drawBlock(currentBlock);
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

function handleInteraction() {
  if (gamePhase === "playing") {
    placeBlock();
  }
}

if (canvas) {
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    handleInteraction();
  });
}
document.addEventListener("keydown", (event) => {
  if (
    (event.code === "Space" || event.key === " ") &&
    gamePhase === "playing"
  ) {
    if (
      document.activeElement?.tagName !== "INPUT" &&
      document.activeElement?.tagName !== "TEXTAREA"
    ) {
      event.preventDefault();
      handleInteraction();
    }
  }
});

if (startButton) {
  startButton.addEventListener("click", () => {
    switchScreen("game");
    resetGame();
  });
}

if (helpButton && helpPopup) {
  helpButton.addEventListener("click", () => {
    helpPopup.style.display = "flex";
  });
}

if (closeHelpPopup && helpPopup) {
  closeHelpPopup.addEventListener("click", () => {
    helpPopup.style.display = "none";
  });
}

if (helpPopup) {
  helpPopup.addEventListener("click", (event) => {
    if (event.target === helpPopup) {
      helpPopup.style.display = "none";
    }
  });
}

if (restartButton) {
  restartButton.addEventListener("click", () => {
    resetGame();
  });
}
if (mainMenuButton) {
  mainMenuButton.addEventListener("click", () => {
    gamePhase = "menu";
    switchScreen("menu");
  });
}

if (!ctx) {
  console.error("FATAL: Failed to get canvas context. Game cannot run.");
  const errorDiv = document.createElement("div");
  errorDiv.textContent =
    "Error: Canvas not supported or initialization failed. Please try a different browser.";
  errorDiv.style.color = "red";
  errorDiv.style.textAlign = "center";
  errorDiv.style.padding = "20px";
  document.body.prepend(errorDiv);
  if (startButton) startButton.disabled = true;
  if (helpButton) helpButton.disabled = true;
  if (menuContainer) menuContainer.style.opacity = "0.5";
} else {
  switchScreen("menu");
}
