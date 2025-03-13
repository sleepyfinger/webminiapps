const { Engine, Render, World, Bodies, Body, Events } = Matter;

// 게임 설정
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BASE_SIZE = 20;
const STEP_SIZE = 30;
const STAGE_COUNT = 40;
const GRAVITY = 0.8;
const MERGE_COOLDOWN = 100; // 병합 후 쿨다운 시간 (ms)
const WALL_THICKNESS = 20; // 벽 두께 추가

// 단계별 크기 및 색상 설정
const CIRCLE_SIZES = Array.from(
  { length: STAGE_COUNT },
  (_, i) => BASE_SIZE + i * STEP_SIZE
);
const CIRCLE_COLORS = Array.from(
  { length: STAGE_COUNT },
  (_, i) => `hsl(${((i * 360) / STAGE_COUNT) % 360}, 70%, 60%)`
);
const MAX_CIRCLE_INDEX = CIRCLE_SIZES.length - 1;

// 엔진 및 렌더러 초기화
const engine = Engine.create({
  enableSleeping: false,
  constraintIterations: 4,
});
engine.gravity.y = GRAVITY;

const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    wireframes: false,
    background: "#f0f0f0",
  },
});

// 벽 생성 함수
function createWalls() {
  const wallOptions = { isStatic: true };
  return [
    Bodies.rectangle(
      CANVAS_WIDTH / 2,
      0,
      CANVAS_WIDTH,
      WALL_THICKNESS,
      wallOptions
    ), // 벽 두께 적용
    Bodies.rectangle(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT,
      CANVAS_WIDTH,
      WALL_THICKNESS, // 벽 두께 적용
      wallOptions
    ),
    Bodies.rectangle(
      WALL_THICKNESS / 2,
      CANVAS_HEIGHT / 2,
      WALL_THICKNESS,
      CANVAS_HEIGHT,
      wallOptions
    ), // 벽 두께 적용
    Bodies.rectangle(
      CANVAS_WIDTH - WALL_THICKNESS / 2,
      CANVAS_HEIGHT / 2,
      WALL_THICKNESS, // 벽 두께 적용
      CANVAS_HEIGHT,
      wallOptions
    ),
  ];
}

// circle 생성 함수
function createCircle(x, y, size) {
  const index = CIRCLE_SIZES.indexOf(size);
  return Bodies.circle(
    Math.max(
      WALL_THICKNESS + size / 2,
      Math.min(CANVAS_WIDTH - WALL_THICKNESS - size / 2, x)
    ), // 벽 두께 반영
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

// Preview circle 생성 함수
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

// 병합 관리 및 처리 시스템
const mergingBodies = new Set();

// 새로운 Circle을 생성하고, 기존 Circle들을 제거하는 함수
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

  // 쿨다운 적용
  setTimeout(() => {
    newCircle.collisionFilter.group = 0;
    mergingBodies.delete(bodyA.id);
    mergingBodies.delete(bodyB.id);
  }, MERGE_COOLDOWN);
}

// 충돌 처리 시스템
const collisionHandler = (event) => {
  for (const pair of event.pairs) {
    const { bodyA, bodyB } = pair;

    // 이미 처리 중인 경우 스킵
    if (mergingBodies.has(bodyA.id) || mergingBodies.has(bodyB.id)) continue;

    const indexA = CIRCLE_SIZES.indexOf(bodyA.circleRadius * 2);
    const indexB = CIRCLE_SIZES.indexOf(bodyB.circleRadius * 2);

    // 같은 크기의 Circle 이고, 마지막 단계가 아니라면
    if (indexA === indexB && indexA < MAX_CIRCLE_INDEX) {
      // 병합 대상 등록
      mergingBodies.add(bodyA.id);
      mergingBodies.add(bodyB.id);

      mergeCircles(bodyA, bodyB);
    }
  }
};

// 이벤트 핸들러 등록
Events.on(engine, "collisionStart", collisionHandler);

// 마우스 및 터치 이벤트 관련 변수
let previewCircle = null;
let isDragging = false;
let currentX = 0;

// 이벤트 핸들러 함수
function handleDown(e) {
  const rect = render.canvas.getBoundingClientRect();
  currentX = (e.clientX || e.touches[0].clientX) - rect.left;
  isDragging = true;

  // preview 원 생성
  previewCircle = createPreviewCircle(currentX, 50, CIRCLE_SIZES[0]);
  World.add(engine.world, previewCircle);
}

function handleMove(e) {
  if (isDragging && previewCircle) {
    const rect = render.canvas.getBoundingClientRect();
    currentX = (e.clientX || e.touches[0].clientX) - rect.left;

    // 미리보기 원이 벽을 벗어나지 않도록 위치 조정
    const minX = WALL_THICKNESS + CIRCLE_SIZES[0] / 2; // 벽 두께를 고려하여 최소 x 값 조정
    const maxX = CANVAS_WIDTH - WALL_THICKNESS - CIRCLE_SIZES[0] / 2; // 벽 두께를 고려하여 최대 x 값 조정
    const constrainedX = Math.max(minX, Math.min(maxX, currentX));

    Body.setPosition(previewCircle, { x: constrainedX, y: 50 });
  }
}

function handleUp(e) {
  if (isDragging) {
    isDragging = false;
    // preview 원 제거 후 실제 원 생성
    World.remove(engine.world, previewCircle);
    const rect = render.canvas.getBoundingClientRect();

    // 미리보기 원과 동일한 제한 적용
    const minX = WALL_THICKNESS + CIRCLE_SIZES[0] / 2; // 벽 두께를 고려하여 최소 x 값 조정
    const maxX = CANVAS_WIDTH - WALL_THICKNESS - CIRCLE_SIZES[0] / 2; // 벽 두께를 고려하여 최대 x 값 조정
    const constrainedX = Math.max(minX, Math.min(maxX, currentX));

    const circle = createCircle(constrainedX, 50, CIRCLE_SIZES[0]);
    World.add(engine.world, circle);
    previewCircle = null;
  }
}
document.addEventListener("mousedown", handleDown);
document.addEventListener("mousemove", handleMove);
document.addEventListener("mouseup", handleUp);

document.addEventListener("touchstart", handleDown);
document.addEventListener("touchmove", handleMove);
document.addEventListener("touchend", handleUp);

// 게임 초기화 및 실행
function initializeGame() {
  World.add(engine.world, createWalls());
  Engine.run(engine);
  Render.run(render);
}

initializeGame();
