const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 320;
const GROUND_HEIGHT = 30;
const ACTUAL_GROUND_Y = CANVAS_HEIGHT - GROUND_HEIGHT;
const PLAYER_INITIAL_MAX_JUMPS = 2;
const TRIPLE_JUMP_POWERUP_DURATION_FRAMES = 300;
const ITEM_TYPE_SCORE = "score";
const ITEM_TYPE_TRIPLE_JUMP = "triple_jump";

function resizeCanvas() {
  const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
  let targetWidth = window.innerWidth;
  let targetHeight = window.innerHeight;

  const windowRatio = targetWidth / targetHeight;

  let newCanvasWidth;
  let newCanvasHeight;

  if (windowRatio > aspectRatio) {
    newCanvasHeight = targetHeight;
    newCanvasWidth = newCanvasHeight * aspectRatio;
  } else {
    newCanvasWidth = targetWidth;
    newCanvasHeight = newCanvasWidth / aspectRatio;
  }

  canvas.style.width = `${newCanvasWidth}px`;
  canvas.style.height = `${newCanvasHeight}px`;
}

window.addEventListener("resize", resizeCanvas);

let mainBgX = 0;
let hillsBgX = 0;

let player = {
  x: 50,
  y: ACTUAL_GROUND_Y - 70,
  width: 30,
  height: 30,
  vy: 0,
  jumpPower: -10,
  onGround: true,
  jumps: 0,
  maxJumps: PLAYER_INITIAL_MAX_JUMPS,
  powerUpActive: null,
  powerUpTimer: 0,
  rotation: 0,
  rotationSpeed: 0.1,
};

let obstacles = [];
let obstacleTimer = 0;

let items = [];
let itemTimer = 0;
let itemBobOffset = 0;
let itemBobDirection = 1;

let clouds = [];
let grassTufts = [];
let mousePos = { x: 0, y: 0 };

const gravity = 0.5;

let score = 0;
let gameOver = false;
let highScore = 0;
let speed = 4;

const BUTTON_SPACING = 10;

const blogButton = {
  width: 40,
  height: 40,
  emoji: "🔗",
  url: "https://blog.naver.com/sleepyfinger",
  x: 0,
  y: 0,
};

const restartButton = {
  width: 130,
  height: 40,
  text: "Restart",
  x: 0,
  y: 0,
};

const shareButton = {
  width: 180,
  height: 40,
  text: "Share Score",
  x: 0,
  y: 0,
};

const jumpSound = document.getElementById("jumpSound");
const itemSound = document.getElementById("itemSound");
const gameOverSound = document.getElementById("gameOverSound");

highScore = parseInt(localStorage.getItem("jumpGameHighScore")) || 0;

function jump() {
  if (gameOver) return;
  if (player.jumps < player.maxJumps) {
    player.vy = player.jumpPower;
    player.onGround = false;
    player.jumps++;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
}
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") jump();
});

function handleCanvasMouseDown(event) {
  event.preventDefault();
  if (!gameOver) {
    jump();
  }
}
canvas.addEventListener("mousedown", handleCanvasMouseDown);

function handleCanvasClick(event) {
  if (gameOver) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;

    if (
      canvasX >= shareButton.x &&
      canvasX <= shareButton.x + shareButton.width &&
      canvasY >= shareButton.y &&
      canvasY <= shareButton.y + shareButton.height
    ) {
      shareScore();
    } else if (
      canvasX >= restartButton.x &&
      canvasX <= restartButton.x + restartButton.width &&
      canvasY >= restartButton.y &&
      canvasY <= restartButton.y + restartButton.height
    ) {
      location.reload();
    } else if (
      canvasX >= blogButton.x &&
      canvasX <= blogButton.x + blogButton.width &&
      canvasY >= blogButton.y &&
      canvasY <= blogButton.y + blogButton.height
    ) {
      window.open(blogButton.url, "_blank");
    }
  }
}
canvas.addEventListener("click", handleCanvasClick);

function handleCanvasTouch(event) {
  event.preventDefault();

  if (gameOver) {
    if (event.changedTouches && event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = (touch.clientX - rect.left) * scaleX;
      const canvasY = (touch.clientY - rect.top) * scaleY;

      if (
        canvasX >= shareButton.x &&
        canvasX <= shareButton.x + shareButton.width &&
        canvasY >= shareButton.y &&
        canvasY <= shareButton.y + shareButton.height
      ) {
        shareScore();
        return;
      } else if (
        canvasX >= restartButton.x &&
        canvasX <= restartButton.x + restartButton.width &&
        canvasY >= restartButton.y &&
        canvasY <= restartButton.y + restartButton.height
      ) {
        location.reload();
        return;
      } else if (
        canvasX >= blogButton.x &&
        canvasX <= blogButton.x + blogButton.width &&
        canvasY >= blogButton.y &&
        canvasY <= blogButton.y + blogButton.height
      ) {
        window.open(blogButton.url, "_blank");
        return;
      }
    }
  } else {
    jump();
  }
}
canvas.addEventListener("touchstart", handleCanvasTouch);

canvas.addEventListener("mousemove", (evt) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  mousePos = {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
  };
});

function createObstacle() {
  const height = 20 + Math.random() * 40;
  obstacles.push({
    x: CANVAS_WIDTH,
    y: ACTUAL_GROUND_Y - height,
    width: 20 + Math.random() * 30,
    height: height,
    speed: speed + Math.random() * 2,
  });
}

function createItem() {
  let itemType = ITEM_TYPE_SCORE;
  if (Math.random() < 0.2) {
    itemType = ITEM_TYPE_TRIPLE_JUMP;
  }

  items.push({
    x: CANVAS_WIDTH,
    y: ACTUAL_GROUND_Y - 70 - Math.random() * 60,
    width: 20,
    height: 20,
    drawY: 0,
    speed: speed,
    collected: false,
    type: itemType,
  });
}

function initializeClouds() {
  clouds = [];
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * CANVAS_WIDTH,
      y: 40 + Math.random() * 80,
      size: 25 + Math.random() * 20,
      speed: 0.2 + Math.random() * 0.5,
    });
  }
}
initializeClouds();

function initializeGrass() {
  grassTufts = [];
  for (let i = 0; i < CANVAS_WIDTH / 15; i++) {
    grassTufts.push({
      x: Math.random() * CANVAS_WIDTH,
      h: 5 + Math.random() * 7,
      w: 4 + Math.random() * 5,
    });
  }
}
initializeGrass();

function updateClouds() {
  clouds.forEach((cloud) => {
    cloud.x -= cloud.speed;
    if (cloud.x + cloud.size < 0) {
      cloud.x = CANVAS_WIDTH + cloud.size + Math.random() * 50;
      cloud.y = 40 + Math.random() * 80;
      cloud.size = 25 + Math.random() * 20;
    }
  });
}

function update() {
  mainBgX -= speed / 2;
  if (mainBgX <= -CANVAS_WIDTH) mainBgX = 0;

  hillsBgX -= speed / 4;
  if (hillsBgX <= -CANVAS_WIDTH) hillsBgX = 0;

  updateClouds();

  player.y += player.vy;
  player.vy += gravity;

  if (!player.onGround) {
    player.rotation += player.rotationSpeed;
  }

  if (player.y + player.height >= ACTUAL_GROUND_Y) {
    player.y = ACTUAL_GROUND_Y - player.height;
    player.vy = 0;
    player.onGround = true;
    player.jumps = 0;
    player.rotation = 0;
  }

  obstacleTimer++;
  if (obstacleTimer > 60 - Math.min(score, 40)) {
    createObstacle();
    obstacleTimer = 0;
  }
  obstacles.forEach((ob) => (ob.x -= ob.speed));
  obstacles = obstacles.filter((ob) => ob.x + ob.width > 0);

  itemTimer++;
  if (itemTimer > 150) {
    createItem();
    itemTimer = 0;
  }
  itemBobOffset += 0.05 * itemBobDirection;
  if (Math.abs(itemBobOffset) > 3) {
    itemBobDirection *= -1;
  }
  items.forEach((it) => {
    it.x -= it.speed;
    it.drawY = it.y + itemBobOffset;
  });
  items = items.filter((it) => it.x + it.width > 0 && !it.collected);

  for (let ob of obstacles) {
    if (
      player.x < ob.x + ob.width &&
      player.x + player.width > ob.x &&
      player.y < ob.y + ob.height &&
      player.y + player.height > ob.y
    ) {
      gameOver = true;
      gameOverSound.currentTime = 0;
      gameOverSound.play();
      if (score > highScore) {
        highScore = score;
        localStorage.setItem("jumpGameHighScore", highScore);
      }
      break;
    }
  }

  for (let it of items) {
    if (
      !it.collected &&
      player.x < it.x + it.width &&
      player.x + player.width > it.x &&
      player.y < it.drawY + it.height &&
      player.y + player.height > it.drawY
    ) {
      it.collected = true;
      itemSound.currentTime = 0;
      itemSound.play();
      if (it.type === ITEM_TYPE_SCORE) {
        score += 5;
      } else if (it.type === ITEM_TYPE_TRIPLE_JUMP) {
        player.maxJumps = 3;
        player.powerUpActive = ITEM_TYPE_TRIPLE_JUMP;
        player.powerUpTimer = TRIPLE_JUMP_POWERUP_DURATION_FRAMES;
      }
    }
  }

  if (!gameOver && obstacleTimer === 0) score++;
  speed = 4 + Math.floor(score / 20);

  if (player.powerUpActive) {
    player.powerUpTimer--;
    if (player.powerUpTimer <= 0) {
      player.maxJumps = PLAYER_INITIAL_MAX_JUMPS;
      player.powerUpActive = null;
    }
  }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawUpArrowIcon(ctx, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const arrowHeight = size * 0.9;
  const headWidth = size * 0.8;
  const headHeight = arrowHeight * 0.6;
  const stemWidth = headWidth * 0.4;
  const stemHeight = arrowHeight - headHeight;

  ctx.moveTo(cx, cy - arrowHeight / 2);
  ctx.lineTo(cx + headWidth / 2, cy - arrowHeight / 2 + headHeight);
  ctx.lineTo(cx + stemWidth / 2, cy - arrowHeight / 2 + headHeight);
  ctx.lineTo(cx + stemWidth / 2, cy + arrowHeight / 2);
  ctx.lineTo(cx - stemWidth / 2, cy + arrowHeight / 2);
  ctx.lineTo(cx - stemWidth / 2, cy - arrowHeight / 2 + headHeight);
  ctx.lineTo(cx - headWidth / 2, cy - arrowHeight / 2 + headHeight);
  ctx.closePath();
  ctx.fill();
}

function shareScore() {
  const gameTitle = "My Jump Game Score!";
  const gameUrl = "https://sleepyfinger.github.io/webminiapps/showcase/jump/";
  const scoreText = `I scored ${score} in Jump Game! My high score is ${highScore}! Let's play!`;
  const fullMessageToCopy = `${scoreText} ${gameUrl}`;

  if (!navigator.share) {
    console.log("Web Share API not supported on this browser. Attempting to copy to clipboard.");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullMessageToCopy)
        .then(() => {
          console.log("Score details copied to clipboard!");
          alert("점수 정보가 클립보드에 복사되었습니다!");
        })
        .catch(err => {
          console.error("Failed to copy score details to clipboard:", err);
          alert("클립보드 복사에 실패했습니다. 수동으로 복사해주세요.");
        });
    } else {
      console.log("Clipboard API also not supported. Cannot copy to clipboard.");
      alert("웹 공유와 클립보드 복사 기능이 모두 지원되지 않는 브라우저입니다.");
    }
    return;
  }

  const shareDataBase = {
    title: gameTitle,
    text: scoreText,
    url: gameUrl,
  };

  const shareTextOnly = () => {
    return navigator.share(shareDataBase)
      .then(() => {
        console.log("Successfully shared score (text only).");
      })
      .catch((error) => {
        console.error("Error sharing text only:", error);
      });
  };

  html2canvas(canvas)
    .then((canvasImg) => {
      if (navigator.canShare && navigator.canShare({ files: [] })) {
        canvasImg.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "jump_game_score.png", { type: "image/png" });
            const shareDataWithFile = { ...shareDataBase, files: [file] };

            navigator.share(shareDataWithFile)
              .then(() => {
                console.log("Successfully shared score with screenshot.");
              })
              .catch((error) => {
                console.error("Error sharing with screenshot:", error);
                if (error.name !== "AbortError") {
                  console.log("Sharing with screenshot failed. Attempting to share text only.");
                  shareTextOnly();
                }
              });
          } else {
            console.error("Screenshot blob creation failed. Attempting to share text only.");
            shareTextOnly();
          }
        }, "image/png");
      } else {
        console.log("File sharing not supported. Attempting to share text only.");
        shareTextOnly();
      }
    })
    .catch((html2canvasError) => {
      console.error("Error capturing canvas with html2canvas:", html2canvasError);
      console.log("Screenshot capture failed. Attempting to share text only.");
      shareTextOnly();
    });
}

function downloadScreenshot(canvasImg) {
  const link = document.createElement("a");
  link.download = "jump_game_score.png";
  link.href = canvasImg.toDataURL("image/png");
  link.click();
}

function drawBackground() {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, ACTUAL_GROUND_Y);
  skyGradient.addColorStop(0, "#87CEEB");
  skyGradient.addColorStop(1, "#cce6ff");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#abd0a0";
  const hillHeight1 = 80;
  ctx.beginPath();
  ctx.moveTo(hillsBgX, ACTUAL_GROUND_Y);
  ctx.lineTo(hillsBgX, ACTUAL_GROUND_Y - hillHeight1 + 20);
  ctx.quadraticCurveTo(
    hillsBgX + CANVAS_WIDTH / 4,
    ACTUAL_GROUND_Y - hillHeight1 - 20,
    hillsBgX + CANVAS_WIDTH / 2,
    ACTUAL_GROUND_Y - hillHeight1 + 10
  );
  ctx.quadraticCurveTo(
    hillsBgX + (CANVAS_WIDTH * 3) / 4,
    ACTUAL_GROUND_Y - hillHeight1 - 10,
    hillsBgX + CANVAS_WIDTH,
    ACTUAL_GROUND_Y - hillHeight1 + 30
  );
  ctx.lineTo(hillsBgX + CANVAS_WIDTH, ACTUAL_GROUND_Y);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hillsBgX + CANVAS_WIDTH, ACTUAL_GROUND_Y);
  ctx.lineTo(hillsBgX + CANVAS_WIDTH, ACTUAL_GROUND_Y - hillHeight1 + 20);
  ctx.quadraticCurveTo(
    hillsBgX + (CANVAS_WIDTH * 5) / 4,
    ACTUAL_GROUND_Y - hillHeight1 - 20,
    hillsBgX + (CANVAS_WIDTH * 3) / 2,
    ACTUAL_GROUND_Y - hillHeight1 + 10
  );
  ctx.quadraticCurveTo(
    hillsBgX + (CANVAS_WIDTH * 7) / 4,
    ACTUAL_GROUND_Y - hillHeight1 - 10,
    hillsBgX + CANVAS_WIDTH * 2,
    ACTUAL_GROUND_Y - hillHeight1 + 30
  );
  ctx.lineTo(hillsBgX + CANVAS_WIDTH * 2, ACTUAL_GROUND_Y);
  ctx.fill();

  ctx.fillStyle = "#fff";
  clouds.forEach((cloud) => {
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.save();
  ctx.translate(mainBgX, 0);

  ctx.fillStyle = "#5A3A22";
  ctx.fillRect(0, ACTUAL_GROUND_Y, CANVAS_WIDTH, GROUND_HEIGHT);
  ctx.fillRect(CANVAS_WIDTH, ACTUAL_GROUND_Y, CANVAS_WIDTH, GROUND_HEIGHT);
  ctx.fillStyle = "#4A2A12";
  ctx.fillRect(0, ACTUAL_GROUND_Y, CANVAS_WIDTH, 2);
  ctx.fillRect(CANVAS_WIDTH, ACTUAL_GROUND_Y, CANVAS_WIDTH, 2);

  ctx.fillStyle = "#3E8E41";
  grassTufts.forEach((tuft) => {
    drawTuft(ctx, tuft.x, ACTUAL_GROUND_Y, tuft.w, tuft.h);
    drawTuft(ctx, CANVAS_WIDTH + tuft.x, ACTUAL_GROUND_Y, tuft.w, tuft.h);
  });
  ctx.restore();
}

function draw() {
  drawBackground();

  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
  ctx.rotate(player.rotation);
  ctx.fillStyle = "#3498db";
  ctx.fillRect(
    -player.width / 2,
    -player.height / 2,
    player.width,
    player.height
  );
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(player.width / 4, -player.height / 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(player.width / 4, -player.height / 4, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (player.onGround) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.beginPath();
    ctx.ellipse(
      player.x + player.width / 2,
      ACTUAL_GROUND_Y - 2,
      player.width / 1.8,
      player.width / 6,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  } else {
    const distanceToGround = ACTUAL_GROUND_Y - (player.y + player.height);
    const maxDistanceForShadow = 180;
    if (
      distanceToGround < maxDistanceForShadow &&
      player.y + player.height < ACTUAL_GROUND_Y
    ) {
      const shadowScale = Math.max(
        0.3,
        1 - distanceToGround / (maxDistanceForShadow * 1.5)
      );
      const shadowAlpha = Math.max(
        0.03,
        0.15 * (1 - distanceToGround / maxDistanceForShadow)
      );
      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(
        player.x + player.width / 2,
        ACTUAL_GROUND_Y - 2,
        (player.width / 1.8) * shadowScale,
        (player.width / 6) * shadowScale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  obstacles.forEach((ob) => {
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(ob.x, ob.y, ob.width, 5);
  });

  items.forEach((it) => {
    if (!it.collected) {
      let itemText = "";
      let itemColor = "#000";

      if (it.type === ITEM_TYPE_SCORE) {
        itemColor = "#f1c40f";
        drawStar(
          ctx,
          it.x + it.width / 2,
          it.drawY + it.height / 2,
          5,
          it.width / 1.8,
          it.width / 3.6,
          itemColor
        );
      } else if (it.type === ITEM_TYPE_TRIPLE_JUMP) {
        itemColor = "#2ecc71";
        drawUpArrowIcon(
          ctx,
          it.x + it.width / 2,
          it.drawY + it.height / 2,
          it.width * 1.1,
          itemColor
        );
      }
    }
  });

  const scoreText = `⭐ ${score}`;
  const highScoreText = `🏆 ${highScore}`;
  const scoreMargin = 15;
  const scoreYPosition = 30;

  ctx.font = "20px Arial";
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = "#222";

  ctx.textAlign = "left";
  ctx.fillText(scoreText, scoreMargin, scoreYPosition);

  ctx.textAlign = "right";
  ctx.fillText(highScoreText, CANVAS_WIDTH - scoreMargin, scoreYPosition);

  if (player.powerUpActive === ITEM_TYPE_TRIPLE_JUMP) {
    ctx.fillStyle = "#2ecc71";
    ctx.textAlign = "center";
    ctx.fillText(
      "Triple Jump! " + Math.ceil(player.powerUpTimer / 60) + "s",
      CANVAS_WIDTH / 2,
      scoreYPosition + 25
    );
  }
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const panelWidth = 300;
    const panelHeight = 260;
    const panelX = CANVAS_WIDTH / 2 - panelWidth / 2;
    const panelY = CANVAS_HEIGHT / 2 - panelHeight / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 15);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillText("Game Over", CANVAS_WIDTH / 2, panelY + 45);

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = "20px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("Your Score: " + score, CANVAS_WIDTH / 2, panelY + 95);
    ctx.fillText("🏆 High Score: " + highScore, CANVAS_WIDTH / 2, panelY + 130);

    const BUTTON_BOTTOM_MARGIN_PANEL = 25;
    const BUTTON_SPACING_PANEL = 10;

    const yPosBottomRow =
      panelY + panelHeight - BUTTON_BOTTOM_MARGIN_PANEL - restartButton.height;
    const yPosShare = yPosBottomRow - shareButton.height - BUTTON_SPACING_PANEL;

    shareButton.x = panelX + (panelWidth - shareButton.width) / 2;
    shareButton.y = yPosShare;

    const bottomButtonsGroupWidth =
      restartButton.width + BUTTON_SPACING_PANEL + blogButton.width;
    restartButton.x = panelX + (panelWidth - bottomButtonsGroupWidth) / 2;
    restartButton.y = yPosBottomRow;

    blogButton.x = restartButton.x + restartButton.width + BUTTON_SPACING_PANEL;
    blogButton.y = yPosBottomRow;

    let isHoveringShareButton =
      mousePos.x >= shareButton.x &&
      mousePos.x <= shareButton.x + shareButton.width &&
      mousePos.y >= shareButton.y &&
      mousePos.y <= shareButton.y + shareButton.height;
    let isHoveringRestartButton =
      mousePos.x >= restartButton.x &&
      mousePos.x <= restartButton.x + restartButton.width &&
      mousePos.y >= restartButton.y &&
      mousePos.y <= restartButton.y + restartButton.height;
    let isHoveringBlogButton =
      mousePos.x >= blogButton.x &&
      mousePos.x <= blogButton.x + blogButton.width &&
      mousePos.y >= blogButton.y &&
      mousePos.y <= blogButton.y + blogButton.height;

    if (
      isHoveringShareButton ||
      isHoveringRestartButton ||
      isHoveringBlogButton
    ) {
      if (canvas.style.cursor !== "pointer") canvas.style.cursor = "pointer";
    } else {
      if (canvas.style.cursor !== "default") canvas.style.cursor = "default";
    }

    ctx.fillStyle = isHoveringShareButton ? "#3498db" : "#2980b9";
    drawRoundedRect(
      ctx,
      shareButton.x,
      shareButton.y,
      shareButton.width,
      shareButton.height,
      5
    );
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Arial";
    ctx.fillText(
      shareButton.text,
      shareButton.x + shareButton.width / 2,
      shareButton.y + shareButton.height / 2 + 1
    );

    ctx.fillStyle = isHoveringBlogButton ? "#0056b3" : "#007bff";
    drawRoundedRect(
      ctx,
      blogButton.x,
      blogButton.y,
      blogButton.width,
      blogButton.height,
      5
    );
    ctx.fillStyle = "#fff";
    const emojiFontSize = blogButton.height * 0.65;
    ctx.font = `bold ${emojiFontSize}px Arial`;
    ctx.fillText(
      blogButton.emoji,
      blogButton.x + blogButton.width / 2,
      blogButton.y + blogButton.height / 2
    );

    ctx.fillStyle = isHoveringRestartButton ? "#5cb85c" : "#4CAF50";
    drawRoundedRect(
      ctx,
      restartButton.x,
      restartButton.y,
      restartButton.width,
      restartButton.height,
      5
    );
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Arial";
    ctx.fillText(
      restartButton.text,
      restartButton.x + restartButton.width / 2,
      restartButton.y + restartButton.height / 2 + 1
    );

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  } else {
    if (canvas.style.cursor !== "default") canvas.style.cursor = "default";
  }
}

const desiredFPS = 60;
const frameDuration = 1000 / desiredFPS;
let thenTimestamp;

function gameLoop() {
  requestAnimationFrame(gameLoop);

  const currentTimestamp = performance.now();

  if (thenTimestamp === undefined) {
    thenTimestamp = currentTimestamp;
  }

  const elapsed = currentTimestamp - thenTimestamp;

  if (elapsed >= frameDuration) {
    thenTimestamp = currentTimestamp - (elapsed % frameDuration);

    if (!gameOver) update();
    draw();
  }
}

initializeClouds();
resizeCanvas();

function drawTuft(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - w / 3, y - h * 0.6);
  ctx.lineTo(x, y - h);
  ctx.lineTo(x + w / 3, y - h * 0.6);
  ctx.lineTo(x + w / 2, y);
  ctx.fill();
}
requestAnimationFrame(gameLoop);
