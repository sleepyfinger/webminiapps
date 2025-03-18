const GAME_CONFIG = {
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,
  BASE_CIRCLE_SIZE: 30,
  CIRCLE_STEP: 35,
  NUM_CIRCLE_STAGES: 10,
  GRAVITY: 0.9,
  MERGE_COOLDOWN_MS: 100,
  WALL_THICKNESS: 20,
  HIGH_STACK_THRESHOLD: 400,
  SPAWN_COOLDOWN_MS: 300,
  MAX_SOUND_CHANNELS: 10,
  GAME_TIME_LIMIT_SEC: 10,
  BACKGROUND_COLOR: "#f3e5f5",
  CIRCLE_IMAGES: [
    "images/circle1.png",
    "images/circle2.png",
    "images/circle3.png",
    "images/circle4.png",
    "images/circle5.png",
    "images/circle6.png",
    "images/circle7.png",
    "images/circle8.png",
    "images/circle9.png",
    "images/circle10.png",
  ],
  SFX_PATH: "sounds/463388__vilkas_sound__vs-pop_4.mp3",
};

const { Engine, Render, World, Composite, Bodies, Body, Events } = Matter;

let score = 0;
let timeRemaining = GAME_CONFIG.GAME_TIME_LIMIT_SEC;
let highScore = localStorage.getItem("highScore") || 0;
let isGameOver = false;
let isTimerRunning = false;
let canSpawnCircle = true;
let isMouseDown = false;
let previewCircle = null;
let isDragging = false;
let currentX = 0;
let widthScaleFactor = 1;
let heightScaleFactor = 1;
const mergingBodies = new Set();
const circleCollisionCounts = new Map();
let intervalId;
const imageSizes = {};

const CIRCLE_SIZES = Array.from(
  { length: GAME_CONFIG.NUM_CIRCLE_STAGES },
  (_, i) =>
    Math.round(GAME_CONFIG.BASE_CIRCLE_SIZE + i * GAME_CONFIG.CIRCLE_STEP)
);
const MAX_CIRCLE_INDEX = CIRCLE_SIZES.length - 1;

const engine = Engine.create({
  enableSleeping: false,
  constraintIterations: 4,
});
engine.gravity.y = GAME_CONFIG.GRAVITY;

const render = Render.create({
  element: document.querySelector(".game-inner-container"),
  engine,
  options: {
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: GAME_CONFIG.CANVAS_HEIGHT,
    wireframes: false,
    background: GAME_CONFIG.BACKGROUND_COLOR,
  },
});

const canvas = render.canvas;
const highestStackLine = document.getElementById("highest-stack-line");
const highStackLine = document.getElementById("high-stack-line");
const gameTimeoutContainer = document.querySelector(".game-timeout-container");
const optionsBtn = document.querySelector(".options-btn");
const optionsPopup = document.getElementById("optionsPopup");
const timeoutContainer = document.querySelector(".timeout-container");

const soundPool = Array.from({ length: GAME_CONFIG.MAX_SOUND_CHANNELS }, () => {
  const sound = new Audio(GAME_CONFIG.SFX_PATH);
  sound.volume = 0.5;
  return sound;
});

function playSound() {
  const sound = soundPool.find((s) => s.paused || s.ended);
  if (sound) {
    sound.currentTime = 0;
    sound.play();
  }
}

function updateScore(points) {
  score += points;
  document.getElementById("score").textContent = score;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    updateHighScore();
  }
}

function updateHighScore() {
  document.getElementById(
    "highScore"
  ).textContent = `High Score : ${highScore}`;
}

function updateTimeOutBar() {
  const timeoutProgress = document.querySelector(".timeout-progress");
  timeoutProgress.style.width = `${
    (timeRemaining / GAME_CONFIG.GAME_TIME_LIMIT_SEC) * 100
  }%`;
}

function updateScaleFactors() {
  const canvasRect = canvas.getBoundingClientRect();
  widthScaleFactor = canvasRect.width / GAME_CONFIG.CANVAS_WIDTH;
  heightScaleFactor = canvasRect.height / GAME_CONFIG.CANVAS_HEIGHT;
}

function getLogicalPosition(clientX, clientY) {
  const canvasRect = canvas.getBoundingClientRect();
  const clampedClientX = Math.max(
    canvasRect.left,
    Math.min(clientX, canvasRect.right)
  );
  const clampedClientY = Math.max(
    canvasRect.top,
    Math.min(clientY, canvasRect.bottom)
  );
  const logicalX = (clampedClientX - canvasRect.left) / widthScaleFactor;
  const logicalY = (clampedClientY - canvasRect.top) / heightScaleFactor;
  return { x: logicalX, y: logicalY };
}

function createCircle(x, y, size) {
  const index = CIRCLE_SIZES.indexOf(size);
  const radius = size / 2;
  const constrainedX = Math.max(
    GAME_CONFIG.WALL_THICKNESS + radius,
    Math.min(GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.WALL_THICKNESS - radius, x)
  );
  const constrainedY = Math.max(
    radius,
    Math.min(GAME_CONFIG.CANVAS_HEIGHT - radius, y)
  );
  const circle = Bodies.circle(constrainedX, constrainedY, radius, {
    restitution: 0.3,
    friction: 0,
    render: {
      sprite: {
        texture: GAME_CONFIG.CIRCLE_IMAGES[index],
        xScale: size / imageSizes[GAME_CONFIG.CIRCLE_IMAGES[index]].width,
        yScale: size / imageSizes[GAME_CONFIG.CIRCLE_IMAGES[index]].height,
      },
    },
    collisionFilter: { group: Body.nextGroup(true) },
    label: `Circle-${index + 1}`,
    isSensor: false,
  });
  circleCollisionCounts.set(circle.id, 0);
  return circle;
}

function createPreviewCircle(x, y, size) {
  const index = CIRCLE_SIZES.indexOf(size);
  return Bodies.circle(x, y, size / 2, {
    isStatic: true,
    isSensor: true,
    render: {
      opacity: 0.5,
      sprite: {
        texture: GAME_CONFIG.CIRCLE_IMAGES[index],
        xScale: size / imageSizes[GAME_CONFIG.CIRCLE_IMAGES[index]].width,
        yScale: size / imageSizes[GAME_CONFIG.CIRCLE_IMAGES[index]].height,
      },
    },
  });
}

function getDefaultImageSize(imagePath) {
  const image = new Image();
  image.src = imagePath;
  let width = 0;
  let height = 0;
  image.onload = () => {
    width = image.width;
    height = image.height;
  };
  if (image.complete) {
    width = image.width;
    height = image.height;
  }

  return { width, height };
}

function mergeCircles(bodyA, bodyB) {
  const indexA = CIRCLE_SIZES.indexOf(bodyA.circleRadius * 2);
  const newSize = CIRCLE_SIZES[indexA + 1];
  const newCircle = createCircle(
    (bodyA.position.x + bodyB.position.x) / 2,
    (bodyA.position.y + bodyB.position.y) / 2,
    newSize
  );
  Body.setVelocity(newCircle, {
    x: (bodyA.velocity.x + bodyB.velocity.x) * 0.5,
    y: (bodyA.velocity.y + bodyB.velocity.y) * 0.5,
  });
  World.remove(engine.world, [bodyA, bodyB]);
  World.add(engine.world, newCircle);
  updateScore(10 * (indexA + 1));

  setTimeout(() => {
    playSound();
    newCircle.collisionFilter.group = 0;
    mergingBodies.delete(bodyA.id);
    mergingBodies.delete(bodyB.id);
  }, GAME_CONFIG.MERGE_COOLDOWN_MS);
}

function createWalls() {
  const wallOptions = {
    isStatic: true,
    friction: 0,
    render: { fillStyle: "#f5d6e0" },
  };
  return [
    Bodies.rectangle(
      GAME_CONFIG.CANVAS_WIDTH / 2,
      0,
      GAME_CONFIG.CANVAS_WIDTH,
      GAME_CONFIG.WALL_THICKNESS,
      wallOptions
    ),
    Bodies.rectangle(
      GAME_CONFIG.CANVAS_WIDTH / 2,
      GAME_CONFIG.CANVAS_HEIGHT,
      GAME_CONFIG.CANVAS_WIDTH,
      GAME_CONFIG.WALL_THICKNESS,
      wallOptions
    ),
    Bodies.rectangle(
      GAME_CONFIG.WALL_THICKNESS / 2,
      GAME_CONFIG.CANVAS_HEIGHT / 2,
      GAME_CONFIG.WALL_THICKNESS,
      GAME_CONFIG.CANVAS_HEIGHT,
      wallOptions
    ),
    Bodies.rectangle(
      GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.WALL_THICKNESS / 2,
      GAME_CONFIG.CANVAS_HEIGHT / 2,
      GAME_CONFIG.WALL_THICKNESS,
      GAME_CONFIG.CANVAS_HEIGHT,
      wallOptions
    ),
  ];
}

function checkCircleHeight() {
  let lowestCircleBottomY = GAME_CONFIG.CANVAS_HEIGHT;
  let hasStableCircle = false;

  for (const body of Composite.allBodies(engine.world)) {
    if (body.label && body.label.startsWith("Circle-")) {
      if (circleCollisionCounts.get(body.id) > 0) {
        lowestCircleBottomY = Math.min(
          lowestCircleBottomY,
          body.position.y - body.circleRadius
        );
        hasStableCircle = true;
      }
    }
  }

  const highestCircleY = Math.max(0, lowestCircleBottomY);
  highestStackLine.style.top = `${highestCircleY * heightScaleFactor}px`;

  if (
    hasStableCircle &&
    highestCircleY <
      GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.HIGH_STACK_THRESHOLD
  ) {
    highStackLine.style.backgroundColor = "rgb(255, 105, 180,0.7)";
    isTimerRunning = true;
  } else {
    highStackLine.style.backgroundColor = "rgb(245, 200, 224,0.7)";
    isTimerRunning = false;
  }
}

function handleCollision(event) {
  for (const pair of event.pairs) {
    const { bodyA, bodyB } = pair;

    if (bodyA.label && bodyA.label.startsWith("Circle-")) {
      circleCollisionCounts.set(
        bodyA.id,
        (circleCollisionCounts.get(bodyA.id) || 0) + 1
      );
    }
    if (bodyB.label && bodyB.label.startsWith("Circle-")) {
      circleCollisionCounts.set(
        bodyB.id,
        (circleCollisionCounts.get(bodyB.id) || 0) + 1
      );
    }
    if (mergingBodies.has(bodyA.id) || mergingBodies.has(bodyB.id)) continue;

    const indexA = CIRCLE_SIZES.indexOf(bodyA.circleRadius * 2);
    const indexB = CIRCLE_SIZES.indexOf(bodyB.circleRadius * 2);
    if (indexA === indexB && indexA < MAX_CIRCLE_INDEX) {
      mergingBodies.add(bodyA.id);
      mergingBodies.add(bodyB.id);
      mergeCircles(bodyA, bodyB);
    }
  }
}

function handleDown(e) {
  if (
    !canSpawnCircle ||
    isGameOver ||
    optionsPopup.style.display === "flex" ||
    isMouseDown
  )
    return;
  isMouseDown = true;
  const { clientX, clientY } = e.touches ? e.touches[0] : e;
  const logicalPosition = getLogicalPosition(clientX, clientY);

  isDragging = true;
  currentX = logicalPosition.x;
  previewCircle = createPreviewCircle(currentX, 50, CIRCLE_SIZES[0]);
  World.add(engine.world, previewCircle);
}

function handleMove(e) {
  if (
    isDragging &&
    previewCircle &&
    optionsPopup.style.display !== "flex" &&
    isMouseDown
  ) {
    const { clientX, clientY } = e.touches ? e.touches[0] : e;
    const logicalPosition = getLogicalPosition(clientX, clientY);
    currentX = logicalPosition.x;
    const constrainedX = Math.max(
      GAME_CONFIG.WALL_THICKNESS + CIRCLE_SIZES[0] / 2,
      Math.min(
        GAME_CONFIG.CANVAS_WIDTH -
          GAME_CONFIG.WALL_THICKNESS -
          CIRCLE_SIZES[0] / 2,
        currentX
      )
    );
    Body.setPosition(previewCircle, { x: constrainedX, y: 50 });
  }
}

function handleUp(e) {
  if (isDragging && optionsPopup.style.display !== "flex") {
    isMouseDown = false;
    isDragging = false;
    World.remove(engine.world, previewCircle);
    const { clientX, clientY } = e.changedTouches ? e.changedTouches[0] : e;

    if (!checkMouseInCanvas(clientX, clientY)) {
      previewCircle = null;
      return;
    }

    const logicalPosition = getLogicalPosition(clientX, clientY);
    currentX = logicalPosition.x;

    const constrainedX = Math.max(
      GAME_CONFIG.WALL_THICKNESS + CIRCLE_SIZES[0] / 2,
      Math.min(
        GAME_CONFIG.CANVAS_WIDTH -
          GAME_CONFIG.WALL_THICKNESS -
          CIRCLE_SIZES[0] / 2,
        currentX
      )
    );
    const circle = createCircle(constrainedX, 50, CIRCLE_SIZES[0]);
    World.add(engine.world, circle);
    previewCircle = null;
    canSpawnCircle = false;

    setTimeout(() => {
      canSpawnCircle = true;
    }, GAME_CONFIG.SPAWN_COOLDOWN_MS);
  }
}

function checkMouseInCanvas(clientX, clientY) {
  const canvasRect = canvas.getBoundingClientRect();
  return (
    clientX > canvasRect.left &&
    clientX < canvasRect.right &&
    clientY > canvasRect.top &&
    clientY < canvasRect.bottom
  );
}

function gameOver() {
  if (isGameOver) return;
  isGameOver = true;
  clearInterval(intervalId);
  document.querySelector(".overlay").style.display = "flex";
  document.getElementById("finalScore").textContent = `Your score: ${score}`;
  updateHighScore();
}

function startTimeOut() {
  intervalId = setInterval(() => {
    if (isTimerRunning) {
      timeRemaining--;
      updateTimeOutBar();
      if (timeRemaining <= 0) {
        gameOver();
      }
    } else if (timeRemaining < GAME_CONFIG.GAME_TIME_LIMIT_SEC) {
      timeRemaining += 0.5;
      updateTimeOutBar();
    }
  }, 1000);
}

function initializeGame() {
  const imagePromises = GAME_CONFIG.CIRCLE_IMAGES.map((imagePath) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = imagePath;
      img.onload = () => {
        imageSizes[imagePath] = { width: img.width, height: img.height };
        resolve();
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${imagePath}`);
        reject(new Error(`Failed to load image: ${imagePath}`));
      };
    });
  });

  Promise.all(imagePromises)
    .then(() => {
      World.add(engine.world, createWalls());
      Matter.Runner.run(engine);
      Render.run(render);
      startTimeOut();
      updateScaleFactors();

      highStackLine.style.top = `${
        (GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.HIGH_STACK_THRESHOLD) *
        heightScaleFactor
      }px`;
      highStackLine.style.backgroundColor = "rgb(245, 200, 224,0.7)";

      document.getElementById("score").classList.add("animate");
      gameTimeoutContainer.appendChild(timeoutContainer);
      const closeOptions = document.getElementById("closeOptions");
      const soundVolumeSlider = document.getElementById("soundVolume");

      optionsBtn.addEventListener("click", () => {
        optionsPopup.style.display = "flex";
      });
      closeOptions.addEventListener("click", () => {
        optionsPopup.style.display = "none";
      });
      soundVolumeSlider.addEventListener("input", () => {
        const volume = parseFloat(soundVolumeSlider.value);
        soundPool.forEach((sound) => (sound.volume = volume));
      });
      updateHighScore();
    })
    .catch((error) => {
      console.error("Error loading images:", error);
    });
}

Events.on(engine, "collisionStart", handleCollision);
Events.on(engine, "afterUpdate", () => {
  checkCircleHeight();
  updateScaleFactors();
});

document.addEventListener("mousedown", handleDown);
document.addEventListener("mousemove", handleMove);
document.addEventListener("mouseup", handleUp);
document.addEventListener("touchstart", handleDown);
document.addEventListener("touchmove", handleMove);
document.addEventListener("touchend", handleUp);
document.querySelector(".overlay button").addEventListener("click", () => {
  location.reload();
});
initializeGame();
