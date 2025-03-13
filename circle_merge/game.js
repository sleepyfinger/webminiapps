const { Engine, Render, World, Bodies, Body, Events } = Matter;

// 게임 설정
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BASE_SIZE = 20;
const STEP_SIZE = 30;
const STAGE_COUNT = 40;
const GRAVITY = 0.8;
const MERGE_COOLDOWN = 100; // 병합 후 쿨다운 시간 (ms)

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
    Bodies.rectangle(CANVAS_WIDTH / 2, 0, CANVAS_WIDTH, 20, wallOptions),
    Bodies.rectangle(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT,
      CANVAS_WIDTH,
      20,
      wallOptions
    ),
    Bodies.rectangle(0, CANVAS_HEIGHT / 2, 20, CANVAS_HEIGHT, wallOptions),
    Bodies.rectangle(
      CANVAS_WIDTH,
      CANVAS_HEIGHT / 2,
      20,
      CANVAS_HEIGHT,
      wallOptions
    ),
  ];
}

// circle 생성 함수
function createCircle(x, y, size) {
  const index = CIRCLE_SIZES.indexOf(size);
  return Bodies.circle(
    Math.max(size / 2, Math.min(CANVAS_WIDTH - size / 2, x)),
    Math.max(size / 2, Math.min(CANVAS_HEIGHT - size / 2, y)),
    size / 2,
    {
      restitution: 0.3,
      friction: 0.001,
      render: { fillStyle: CIRCLE_COLORS[index] },
      collisionFilter: { group: Body.nextGroup(true) },
      label: `Circle-${index + 1}`,
    }
  );
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

// 클릭 이벤트
document.addEventListener("click", (e) => {
  const rect = render.canvas.getBoundingClientRect();
  const circle = createCircle(e.clientX - rect.left, 50, CIRCLE_SIZES[0]);
  World.add(engine.world, circle);
});

// 게임 초기화 및 실행
function initializeGame() {
  World.add(engine.world, createWalls());
  Engine.run(engine);
  Render.run(render);
}

initializeGame();
