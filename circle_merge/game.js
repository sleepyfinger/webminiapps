const { Engine, Render, World, Bodies, Body, Events } = Matter;

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BASE_SIZE = 20;
const STEP_SIZE = 30;
const STAGE_COUNT = 40;
const GRAVITY = 0.8;
const MERGE_COOLDOWN = 100;
const WALL_THICKNESS = 20;
const SPAWN_COOLDOWN = 300;
const GAME_TIME_LIMIT = 10;

const CIRCLE_SIZES = Array.from(
  { length: STAGE_COUNT },
  (_, i) => BASE_SIZE + i * STEP_SIZE
);
const CIRCLE_COLORS = Array.from(
  { length: STAGE_COUNT },
  (_, i) => `hsl(${((i * 360) / STAGE_COUNT) % 360}, 70%, 60%)`
);
const MAX_CIRCLE_INDEX = CIRCLE_SIZES.length - 1;

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
    background: "transparent",
  },
});

let score = 0;
let timeRemaining = GAME_TIME_LIMIT;
let intervalId;
let isGameOver = false;
let previewCircle = null;
let isDragging = false;
let currentX = 0;
let canSpawnCircle = true;
const mergingBodies = new Set();

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
    timeRemaining--;
    updateTimeOutBar();
    if (timeRemaining <= 0) {
      gameOver();
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
  const wallOptions = { isStatic: true, render: { fillStyle: "#ccc" } };
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

function createCircle(x, y, size) {
  const index = CIRCLE_SIZES.indexOf(size);
  return Bodies.circle(
    Math.max(
      WALL_THICKNESS + size / 2,
      Math.min(CANVAS_WIDTH - WALL_THICKNESS - size / 2, x)
    ),
    Math.max(size / 2, Math.min(CANVAS_HEIGHT - size / 2, y)),
    size / 2,
    {
      restitution: 0.3,
      friction: 0.001,
      render: { fillStyle: CIRCLE_COLORS[index] },
      collisionFilter: { group: Body.nextGroup(true) },
      label: `Circle-${index + 1}`,
      isSensor: false,
    }
  );
}

function createPreviewCircle(x, y, size) {
  const index = CIRCLE_SIZES.indexOf(size);
  return Bodies.circle(x, y, size / 2, {
    isStatic: true,
    isSensor: true,
    render: {
      fillStyle: CIRCLE_COLORS[index],
      opacity: 0.5,
    },
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

Events.on(engine, "collisionStart", collisionHandler);

function handleDown(e) {
  if (!canSpawnCircle || isGameOver) return;

  const rect = render.canvas.getBoundingClientRect();
  currentX = (e.clientX || e.touches[0].clientX) - rect.left;
  isDragging = true;

  previewCircle = createPreviewCircle(currentX, 50, CIRCLE_SIZES[0]);
  World.add(engine.world, previewCircle);
}

function handleMove(e) {
  if (isDragging && previewCircle) {
    const rect = render.canvas.getBoundingClientRect();
    currentX = (e.clientX || e.touches[0].clientX) - rect.left;

    const minX = WALL_THICKNESS + CIRCLE_SIZES[0] / 2;
    const maxX = CANVAS_WIDTH - WALL_THICKNESS - CIRCLE_SIZES[0] / 2;
    const constrainedX = Math.max(minX, Math.min(maxX, currentX));

    Body.setPosition(previewCircle, { x: constrainedX, y: 50 });
  }
}

function handleUp(e) {
  if (isDragging) {
    isDragging = false;
    World.remove(engine.world, previewCircle);
    const rect = render.canvas.getBoundingClientRect();

    const minX = WALL_THICKNESS + CIRCLE_SIZES[0] / 2;
    const maxX = CANVAS_WIDTH - WALL_THICKNESS - CIRCLE_SIZES[0] / 2;
    const constrainedX = Math.max(minX, Math.min(maxX, currentX));

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

function initializeGame() {
  World.add(engine.world, createWalls());
  Engine.run(engine);
  Render.run(render);
  // startTimeOut();
}

initializeGame();
