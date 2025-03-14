const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BASE_SIZE = 30;
const STEP_SIZE = 35;
const STAGE_COUNT = 10;
const GRAVITY = 0.9;
const MERGE_COOLDOWN = 100;
const WALL_THICKNESS = 20;
const HIGH_STACK_HEIGHT = 400;
const SPAWN_COOLDOWN = 300;
const GAME_TIME_LIMIT = 10;
const CIRCLE_SIZES = Array.from({ length: STAGE_COUNT }, (_, i) =>
  Math.round(BASE_SIZE + i * STEP_SIZE)
);
const CIRCLE_COLORS = Array.from(
  { length: STAGE_COUNT },
  (_, i) => `hsl(${((i * 360) / STAGE_COUNT) % 360}, 70%, 60%)`
);
const MAX_CIRCLE_INDEX = CIRCLE_SIZES.length - 1;

const { Engine, Render, World, Composite, Bodies, Body, Events } = Matter;
const BACKGROUND_COLOR = "#f0f4f8";

const engine = Engine.create({
  enableSleeping: false,
  constraintIterations: 4,
});
engine.gravity.y = GRAVITY;

const render = Render.create({
  element: document.getElementById("game-container"),
  engine: engine,
  options: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    wireframes: false,
    background: BACKGROUND_COLOR,
  },
});

const canvas = render.canvas;
const highestStackLine = document.getElementById("highest-stack-line");
const highStackLine = document.getElementById("high-stack-line");

let score = 0;
let timeRemaining = GAME_TIME_LIMIT;
let intervalId;
let isGameOver = false;
let isTimerRunning = false;
let canSpawnCircle = true;
const mergingBodies = new Set();

let widthScaleFactor = 1;
let heightScaleFactor = 1;

let previewCircle = null;
let isDragging = false;
let currentX = 0;
const circleCollisionCounts = new Map();

function updateScore(points) {
  score += points;
  document.getElementById("score").textContent = score;
}

function updateTimeOutBar() {
  const timeoutProgress = document.querySelector(".timeout-progress");
  const progressWidth = (timeRemaining / GAME_TIME_LIMIT) * 100;
  timeoutProgress.style.width = `${progressWidth}%`;
}

function startTimeOut() {
  intervalId = setInterval(() => {
    if (isTimerRunning) {
      timeRemaining--;
      updateTimeOutBar();
      if (timeRemaining <= 0) {
        gameOver();
      }
    } else if (timeRemaining < GAME_TIME_LIMIT) {
      timeRemaining += 0.5;
      updateTimeOutBar();
    }
  }, 1000);
}

function gameOver() {
  if (isGameOver) return;
  isGameOver = true;
  clearInterval(intervalId);
  document.querySelector(".overlay").style.display = "flex";
  document.getElementById("finalScore").textContent = `Your score: ${score}`;
}

function restartGame() {
  location.reload();
}

function createWalls() {
  const wallOptions = {
    isStatic: true,
    friction: 0,
    render: { fillStyle: "#e8ebef" },
  };
  return [
    Bodies.rectangle(
      CANVAS_WIDTH / 2,
      0,
      CANVAS_WIDTH,
      WALL_THICKNESS,
      wallOptions
    ),
    Bodies.rectangle(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT,
      CANVAS_WIDTH,
      WALL_THICKNESS,
      wallOptions
    ),
    Bodies.rectangle(
      WALL_THICKNESS / 2,
      CANVAS_HEIGHT / 2,
      WALL_THICKNESS,
      CANVAS_HEIGHT,
      wallOptions
    ),
    Bodies.rectangle(
      CANVAS_WIDTH - WALL_THICKNESS / 2,
      CANVAS_HEIGHT / 2,
      WALL_THICKNESS,
      CANVAS_HEIGHT,
      wallOptions
    ),
  ];
}

function updateScaleFactors() {
  const canvasRect = canvas.getBoundingClientRect();
  widthScaleFactor = canvasRect.width / CANVAS_WIDTH;
  heightScaleFactor = canvasRect.height / CANVAS_HEIGHT;
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
  const constrainedX = Math.max(
    WALL_THICKNESS + size / 2,
    Math.min(CANVAS_WIDTH - WALL_THICKNESS - size / 2, x)
  );
  const constrainedY = Math.max(
    size / 2,
    Math.min(CANVAS_HEIGHT - size / 2, y)
  );
  const circle = Bodies.circle(constrainedX, constrainedY, size / 2, {
    restitution: 0.3,
    friction: 0,
    render: { fillStyle: CIRCLE_COLORS[index] },
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
    render: { fillStyle: CIRCLE_COLORS[index], opacity: 0.5 },
  });
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
    newCircle.collisionFilter.group = 0;
    mergingBodies.delete(bodyA.id);
    mergingBodies.delete(bodyB.id);
  }, MERGE_COOLDOWN);
}

const collisionHandler = (event) => {
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
};

function checkCircleHeight() {
  let lowestCircleBottomY = CANVAS_HEIGHT;
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

  isTimerRunning =
    hasStableCircle && highestCircleY < CANVAS_HEIGHT - HIGH_STACK_HEIGHT;
}

Events.on(engine, "collisionStart", collisionHandler);

function handleDown(e) {
  if (!canSpawnCircle || isGameOver) return;
  const { clientX, clientY } = e.touches ? e.touches[0] : e;
  const canvasRect = canvas.getBoundingClientRect();

  if (
    clientX < canvasRect.left ||
    clientX > canvasRect.right ||
    clientY < canvasRect.top ||
    clientY > canvasRect.bottom
  ) {
    return;
  }

  const logicalPosition = getLogicalPosition(clientX, clientY);
  currentX = logicalPosition.x;
  isDragging = true;

  previewCircle = createPreviewCircle(currentX, 50, CIRCLE_SIZES[0]);
  World.add(engine.world, previewCircle);
}

function handleMove(e) {
  if (isDragging && previewCircle) {
    const { clientX, clientY } = e.touches ? e.touches[0] : e;

    const logicalPosition = getLogicalPosition(clientX, clientY);
    currentX = logicalPosition.x;
    const constrainedX = Math.max(
      WALL_THICKNESS + CIRCLE_SIZES[0] / 2,
      Math.min(CANVAS_WIDTH - WALL_THICKNESS - CIRCLE_SIZES[0] / 2, currentX)
    );
    Body.setPosition(previewCircle, { x: constrainedX, y: 50 });
  }
}

function handleUp(e) {
  if (isDragging) {
    isDragging = false;
    World.remove(engine.world, previewCircle);

    const { clientX, clientY } = e.changedTouches ? e.changedTouches[0] : e;
    const canvasRect = canvas.getBoundingClientRect();

    if (
      clientX < canvasRect.left ||
      clientX > canvasRect.right ||
      clientY < canvasRect.top ||
      clientY > canvasRect.bottom
    ) {
      previewCircle = null;
      return;
    }
    const logicalPosition = getLogicalPosition(clientX, clientY);
    currentX = logicalPosition.x;

    const constrainedX = Math.max(
      WALL_THICKNESS + CIRCLE_SIZES[0] / 2,
      Math.min(CANVAS_WIDTH - WALL_THICKNESS - CIRCLE_SIZES[0] / 2, currentX)
    );

    const circle = createCircle(constrainedX, 50, CIRCLE_SIZES[0]);
    World.add(engine.world, circle);
    previewCircle = null;

    canSpawnCircle = false;
    setTimeout(() => {
      canSpawnCircle = true;
    }, SPAWN_COOLDOWN);
  }
}

document.addEventListener("mousedown", handleDown);
document.addEventListener("mousemove", handleMove);
document.addEventListener("mouseup", handleUp);
document.addEventListener("touchstart", handleDown);
document.addEventListener("touchmove", handleMove);
document.addEventListener("touchend", handleUp);
document
  .querySelector(".overlay button")
  .addEventListener("click", restartGame);

Events.on(engine, "afterUpdate", () => {
  checkCircleHeight();
  updateScaleFactors();
});

function initializeGame() {
  World.add(engine.world, createWalls());
  Matter.Runner.run(engine);
  Render.run(render);
  startTimeOut();
  updateScaleFactors();
  highStackLine.style.top = `${
    (CANVAS_HEIGHT - HIGH_STACK_HEIGHT) * heightScaleFactor
  }px`;

  const scoreElement = document.getElementById("score");
  scoreElement.classList.add("animate");
}

initializeGame();
