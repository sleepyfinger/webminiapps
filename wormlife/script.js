"use strict";

const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;
const CANVAS_PADDING = 30;
const HUNGER_DECREASE_RATE = 0.15;
const HEALTH_DECREASE_RATE_HUNGER = 1.2;
const REPRODUCTION_COOLDOWN_FEMALE = 12000;
const REPRODUCTION_COOLDOWN_MALE = 6000;
const MIN_HUNGER_TO_REPRODUCE_FEMALE = 85;
const MIN_HUNGER_TO_REPRODUCE_MALE = 75;
const EAT_DISTANCE = 35;
const REPRODUCTION_DISTANCE = 55;
const INITIAL_EARTHWORMS = 5;
const MUTATION_RATE = 0.15;
const BODY_SEGMENT_COUNT = 50;
const EARTHWORM_COLOR_MALE = "#FFB6C1";
const EARTHWORM_COLOR_FEMALE = "#E6E6FA";
const EARTHWORM_TURN_RATE = 0.8;
const EARTHWORM_SPEED_VARIATION = 2.5;
const REPRODUCTION_LIMIT_HIGH = 80;
const REPRODUCTION_LIMIT_LOW = 30;
const INSECT_INITIAL_FOOD = 100;
const EARTHWORM_EAT_RATE = 1.5;
const FOOD_TO_HUNGER_RATIO = 0.8;
const FOOD_SEARCH_HUNGER_THRESHOLD = 90;
const FOOD_EAT_HUNGER_THRESHOLD = 95;
const MAX_INSECTS = 5;
const MATING_DURATION = 3500;
const EGG_HATCH_TIME = 8000;
const EGG_SIZE = 8;
const EGG_COLOR = "#FFFACD";
const EGG_BORDER_COLOR = "#D2B48C";
const MATING_ORBIT_SPEED = 0.002;
const MATING_ORBIT_RADIUS_FACTOR = 0.12;
const INITIAL_EARTHWORM_SIZE = 30;
const ADULT_EARTHWORM_SIZE = 50;
const GROWTH_RATE = 0.01;
const FOOD_DETECTION_RADIUS = 100;
const SURVIVAL_BONUS_TIME = 60000;
const EMOJI_FOOD = "🍎";
const EMOJI_HEART = "❤️";
const SYMBOL_FEMALE = "♀";
const SYMBOL_MALE = "♂";

const simulationState = {
  earthworms: [],
  insects: [],
  eggs: [],
  lastTimestamp: 0,
  isRunning: true,
  totalTime: 0,
  animationFrameId: null,
  scaleFactor: 1,
  reproductionAllowed: true,
  showHealthBar: false,
  showHungerBar: false,
  maxEarthwormCount: 0,
  survivalTimer: 0,
};

const uiManager = {
  elements: {},
  init() {
    this.elements.canvas = document.getElementById("simulationCanvas");
    this.elements.ctx = this.elements.canvas?.getContext("2d");
    this.elements.restartButton = document.getElementById("restartButton");
    this.elements.addFoodButton = document.getElementById("addFoodButton");
    this.elements.simulationContainer = document.querySelector(
      ".simulation-container"
    );
    this.elements.survivalGaugeBar =
      document.getElementById("survivalGaugeBar");
    this.elements.totalTimeValue = document.getElementById("totalTimeValue");
    this.elements.earthwormCount = document.getElementById("earthwormCount");
    this.elements.maxEarthwormCount =
      document.getElementById("maxEarthwormCount");
    this.elements.foodCount = document.getElementById("foodCount");
    this.elements.eggCount = document.getElementById("eggCount");

    if (!this.elements.canvas || !this.elements.ctx) {
      console.error(
        "FATAL: Canvas element or 2D context not found! Cannot start simulation."
      );
      simulationState.isRunning = false;
      return false;
    }
    Object.entries(this.elements).forEach(([key, el]) => {
      if (!el && key !== "ctx") {
        console.warn(`UI element '${key}' not found in the DOM.`);
      }
    });
    return true;
  },
  getCanvas() {
    return this.elements.canvas;
  },
  getContext() {
    return this.elements.ctx;
  },
  getSimulationContainer() {
    return this.elements.simulationContainer;
  },
  updateCounts(wormCount, maxWormCount, foodCount, eggCount) {
    if (this.elements.earthwormCount)
      this.elements.earthwormCount.textContent = wormCount;
    if (this.elements.maxEarthwormCount)
      this.elements.maxEarthwormCount.textContent = maxWormCount;
    if (this.elements.foodCount)
      this.elements.foodCount.textContent = foodCount;
    if (this.elements.eggCount) this.elements.eggCount.textContent = eggCount;
  },
  updateTimer(totalTimeMs) {
    if (this.elements.totalTimeValue) {
      const totalSeconds = Math.floor(totalTimeMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      this.elements.totalTimeValue.textContent = `${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`;
    }
  },
  updateSurvivalGauge(timerMs) {
    if (this.elements.survivalGaugeBar) {
      const gaugePercent = Math.min(100, (timerMs / SURVIVAL_BONUS_TIME) * 100);
      this.elements.survivalGaugeBar.style.width = `${gaugePercent}%`;
    }
  },
  showRestartButton(show) {
    if (this.elements.restartButton)
      this.elements.restartButton.classList.toggle("hidden", !show);
  },
  clearCanvas() {
    if (this.elements.ctx && this.elements.canvas) {
      this.elements.ctx.clearRect(
        0,
        0,
        this.elements.canvas.width,
        this.elements.canvas.height
      );
    }
  },
  setupEventListeners() {
    this.elements.canvas?.addEventListener("click", handleCanvasClick);
    this.elements.restartButton?.addEventListener("click", handleRestartClick);
    this.elements.addFoodButton?.addEventListener("click", handleAddFoodClick);
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", cleanup);
  },
  removeEventListeners() {
    this.elements.canvas?.removeEventListener("click", handleCanvasClick);
    this.elements.restartButton?.removeEventListener(
      "click",
      handleRestartClick
    );
    this.elements.addFoodButton?.removeEventListener(
      "click",
      handleAddFoodClick
    );
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("keydown", handleKeyDown);
  },
};

const distance = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
const mutateValue = (value) =>
  value * (1 + (Math.random() - 0.5) * 2 * MUTATION_RATE);
const lerp = (a, b, t) => a + (b - a) * t;
const lightenColor = (hex, percent) => {
  hex = hex.replace(/^#/, "");
  const num = parseInt(hex, 16);
  let r = (num >> 16) + Math.floor(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.floor(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.floor(255 * (percent / 100));
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};
const darkenColor = (hex, percent) => lightenColor(hex, -percent);
function lerpAngle(startAngle, endAngle, t) {
  const difference = endAngle - startAngle;
  const delta = Math.atan2(Math.sin(difference), Math.cos(difference));
  return startAngle + delta * t;
}

class Earthworm {
  constructor(gender, position, dna = {}) {
    this.id = Math.random().toString(36).substring(2, 7);
    this.gender = gender;
    this.health = 100;
    this.hunger = 100;
    this.reproductionCooldown = 0;
    this.isDead = false;
    this.isEating = false;
    this.eatingTarget = null;
    this.isMating = false;
    this.matingPartner = null;
    this.matingTimer = 0;
    this.matingOrbitData = null;
    this.currentSize = INITIAL_EARTHWORM_SIZE;
    this.isAdult = false;
    this.isMoving = true;
    this.hasLaidEggThisMating = false;

    const baseSpeed = dna.speed || Math.random() * 1.2 + 1.0;
    const baseSize = dna.size || Math.random() * 6 + ADULT_EARTHWORM_SIZE;
    const baseOffspringCount =
      dna.offspringCount || Math.floor(Math.random() * 3 + 3);
    this.dna = {
      speed: Math.max(0.3, mutateValue(baseSpeed)),
      size: Math.max(1, mutateValue(baseSize)),
      color:
        dna.color ||
        (this.gender === "male"
          ? EARTHWORM_COLOR_MALE
          : EARTHWORM_COLOR_FEMALE),
      offspringCount: Math.max(1, Math.round(mutateValue(baseOffspringCount))),
    };

    this.bodySegments = [];
    this.generateBody(position);
  }

  generateBody(startPosition) {
    this.bodySegments = [];
    const startAngle = Math.random() * Math.PI * 2;
    for (let i = 0; i < BODY_SEGMENT_COUNT; i++) {
      this.bodySegments.push({
        x: startPosition.x,
        y: startPosition.y,
        angle: startAngle,
      });
    }
  }

  update(deltaTime, insects, earthworms, eggs) {
    if (this.isDead) return;

    this._updateGrowth(deltaTime);

    if (this.isMating) {
      this._handleMating(deltaTime, eggs);
    } else {
      this._updateHungerHealth(deltaTime);
      if (this.isDead) {
        if (
          this.matingPartner?.isMating &&
          this.matingPartner.matingPartner === this
        ) {
          this.matingPartner.stopMating(eggs, false);
        }
        return;
      }

      if (this.isEating) {
        this._eat(deltaTime);
      } else {
        this._findFood(insects);
        this._checkReproduction(earthworms, eggs);
        if (this.isMoving) {
          this._move(deltaTime / 25, insects);
        }
      }
    }

    this._updateBody(deltaTime);
  }

  _updateGrowth(deltaTime) {
    if (!this.isAdult) {
      this.currentSize = Math.min(
        this.dna.size,
        this.currentSize + GROWTH_RATE * deltaTime
      );
      if (this.currentSize >= this.dna.size * 0.8) {
        this.isAdult = true;
      }
    }
  }

  _updateHungerHealth(deltaTime) {
    const dtFactor = deltaTime / 25;
    this.hunger -= HUNGER_DECREASE_RATE * dtFactor;
    this.reproductionCooldown = Math.max(
      0,
      this.reproductionCooldown - deltaTime
    );

    if (this.hunger <= 0) {
      this.health -= HEALTH_DECREASE_RATE_HUNGER * dtFactor;
      this.hunger = 0;
    }

    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  _updateBody(deltaTime) {
    if (this.bodySegments.length <= 1) return;
    const head = this.bodySegments[0];
    const neck = this.bodySegments[1];
    const dx = head.x - neck.x;
    const dy = head.y - neck.y;
    const distanceSq = dx * dx + dy * dy;
    const epsilonSq = 0.0001;

    if (distanceSq >= epsilonSq) {
      for (let i = this.bodySegments.length - 1; i > 0; i--) {
        this.bodySegments[i].x = this.bodySegments[i - 1].x;
        this.bodySegments[i].y = this.bodySegments[i - 1].y;
        this.bodySegments[i].angle = this.bodySegments[i - 1].angle;
      }
    }
  }

  _checkReproduction(earthworms, eggs) {
    if (
      this.isMating ||
      this.isEating ||
      !simulationState.reproductionAllowed ||
      this.reproductionCooldown > 0 ||
      !this.isAdult ||
      this.bodySegments.length === 0
    ) {
      return;
    }

    const minHunger =
      this.gender === "female"
        ? MIN_HUNGER_TO_REPRODUCE_FEMALE
        : MIN_HUNGER_TO_REPRODUCE_MALE;
    if (this.hunger < minHunger) {
      return;
    }

    if (this.gender !== "female") {
      return;
    }

    const head = this.bodySegments[0];
    const partner = earthworms.find((p) => {
      if (
        p.isDead ||
        p.isEating ||
        p.isMating ||
        p.gender !== "male" ||
        p === this ||
        p.reproductionCooldown > 0 ||
        p.hunger < MIN_HUNGER_TO_REPRODUCE_MALE ||
        !p.isAdult ||
        p.bodySegments.length === 0
      ) {
        return false;
      }
      const pHead = p.bodySegments[0];
      const dx = head.x - pHead.x;
      const dy = head.y - pHead.y;
      return dx * dx + dy * dy < REPRODUCTION_DISTANCE ** 2;
    });

    if (partner) {
      this.startMating(partner);
      partner.startMating(this);
    }
  }

  startMating(partner) {
    if (this.bodySegments.length === 0 || partner.bodySegments.length === 0)
      return;

    const head = this.bodySegments[0];
    const partnerHead = partner.bodySegments[0];

    this.isMating = true;
    this.matingPartner = partner;
    this.matingTimer = MATING_DURATION;
    this.isEating = false;
    this.eatingTarget = null;
    this.isMoving = false;
    this.hunger -= 15;
    this.hasLaidEggThisMating = false;

    const dx = partnerHead.x - head.x;
    const dy = partnerHead.y - head.y;
    const initialDistance = Math.max(5, Math.sqrt(dx * dx + dy * dy));
    const orbitRadius = initialDistance * MATING_ORBIT_RADIUS_FACTOR * 1.5;
    const initialAngle = Math.atan2(dy, dx);
    this.matingOrbitData = { radius: orbitRadius, currentAngle: initialAngle };
  }

  _handleMating(deltaTime, eggs) {
    this.matingTimer -= deltaTime;
    const head = this.bodySegments[0];

    if (!this.matingPartner || !this.matingOrbitData) {
      console.warn(
        `[${this.id}] Mating stopped: Missing partner ref or orbit data.`
      );
      this.stopMating(eggs, false);
      return;
    }

    try {
      const partnerHead = this.matingPartner.bodySegments?.[0];
      if (!partnerHead) {
        console.warn(
          `[${this.id}] Mating stopped: Partner [${this.matingPartner.id}] has no body segments.`
        );
        this.stopMating(eggs, false);
        return;
      }

      const midX = (head.x + partnerHead.x) / 2;
      const midY = (head.y + partnerHead.y) / 2;

      const radius = this.matingOrbitData.radius;
      const dx = partnerHead.x - head.x;
      const dy = partnerHead.y - head.y;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      const targetDistance = radius * 1.5;
      const distanceAdjustSpeed = 0.015;
      const adjustedRadius =
        radius + (targetDistance - currentDistance) * distanceAdjustSpeed;
      const baseSpeed = MATING_ORBIT_SPEED * deltaTime;
      const speedVariation = Math.sin(simulationState.totalTime * 0.001) * 0.1;
      const angleIncrement = baseSpeed * (1 + speedVariation);
      this.matingOrbitData.currentAngle =
        (this.matingOrbitData.currentAngle + angleIncrement) % (Math.PI * 2);
      const waveOffset = Math.sin(simulationState.totalTime * 0.002) * 0.05;
      const targetX =
        midX +
        adjustedRadius *
          Math.cos(this.matingOrbitData.currentAngle + waveOffset);
      const targetY =
        midY +
        adjustedRadius *
          Math.sin(this.matingOrbitData.currentAngle + waveOffset);

      const moveAngle = Math.atan2(targetY - head.y, targetX - head.x);
      head.angle = lerpAngle(head.angle, moveAngle, 0.2);
      const approachSpeedFactor = 0.15;
      head.x = lerp(head.x, targetX, approachSpeedFactor);
      head.y = lerp(head.y, targetY, approachSpeedFactor);

      head.x = Math.max(
        CANVAS_PADDING,
        Math.min(WORLD_WIDTH - CANVAS_PADDING, head.x)
      );
      head.y = Math.max(
        CANVAS_PADDING,
        Math.min(WORLD_HEIGHT - CANVAS_PADDING, head.y)
      );
    } catch (e) {
      console.error(
        `[${this.id}] Error during mating movement (partner [${this.matingPartner?.id}]):`,
        e
      );
      this.stopMating(eggs, false);
      return;
    }

    if (this.matingTimer <= 0) {
      if (this.matingPartner && !this.hasLaidEggThisMating) {
        this.layEgg(eggs);
        this.hasLaidEggThisMating = true;
      }
      this.stopMating(eggs, true);
    }
  }

  stopMating(eggs, normalCompletion = false) {
    if (!this.isMating) return;

    const partnerRef = this.matingPartner;

    this.isMating = false;
    this.matingTimer = 0;
    this.matingPartner = null;
    this.matingOrbitData = null;
    this.isMoving = true;

    if (normalCompletion) {
      this.reproductionCooldown =
        this.gender === "female"
          ? REPRODUCTION_COOLDOWN_FEMALE
          : REPRODUCTION_COOLDOWN_MALE;
    }

    if (partnerRef?.isMating && partnerRef.matingPartner === this) {
      partnerRef.stopMating(eggs, false);
    }
  }

  layEgg(eggs) {
    if (!this.matingPartner || this.bodySegments.length === 0) {
      console.warn(`[${this.id}] layEgg conditions not met:`, {
        g: this.gender,
        p: !!this.matingPartner,
        b: this.bodySegments.length,
      });
      return;
    }

    const head = this.bodySegments[0];
    let childDNA;

    try {
      if (!this.matingPartner.dna) throw new Error("Partner DNA missing");
      childDNA = {
        speed: (this.dna.speed + this.matingPartner.dna.speed) / 2,
        size: (this.dna.size + this.matingPartner.dna.size) / 2,
        offspringCount: Math.round(
          (this.dna.offspringCount + this.matingPartner.dna.offspringCount) / 2
        ),
      };
    } catch (e) {
      console.error(
        `[${this.id}] Error calculating child DNA (partner [${this.matingPartner?.id}]):`,
        e
      );
      return;
    }

    let numEggs;
    const rand = Math.random() * 15;

    if (rand < 8) {
      numEggs = 1;
    } else if (rand < 10) {
      numEggs = 2;
    } else if (rand < 12) {
      numEggs = 3;
    } else if (rand < 14) {
      numEggs = 4;
    } else {
      numEggs = 5;
    }

    for (let i = 0; i < numEggs; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 15;
      const eggPos = {
        x: head.x + Math.cos(angle) * distance,
        y: head.y + Math.sin(angle) * distance,
      };
      eggPos.x = Math.max(
        CANVAS_PADDING + EGG_SIZE,
        Math.min(WORLD_WIDTH - CANVAS_PADDING - EGG_SIZE, eggPos.x)
      );
      eggPos.y = Math.max(
        CANVAS_PADDING + EGG_SIZE,
        Math.min(WORLD_HEIGHT - CANVAS_PADDING - EGG_SIZE, eggPos.y)
      );

      eggs.push(new Egg(eggPos, childDNA));
    }
  }

  _eat(deltaTime) {
    if (this.bodySegments.length === 0) return;
    const head = this.bodySegments[0];
    const dtFactor = deltaTime / 25;

    if (
      !this.eatingTarget ||
      this.eatingTarget.foodAmount <= 0 ||
      this.hunger >= 100
    ) {
      this.isEating = false;
      this.eatingTarget = null;
      this.isMoving = true;
      return;
    }

    const distSq =
      (head.x - this.eatingTarget.x) ** 2 + (head.y - this.eatingTarget.y) ** 2;
    const maxEatDistSq = (EAT_DISTANCE * 1.2) ** 2;
    if (distSq > maxEatDistSq) {
      this.isEating = false;
      this.eatingTarget = null;
      this.isMoving = true;
      return;
    }

    const targetAngle = Math.atan2(
      this.eatingTarget.y - head.y,
      this.eatingTarget.x - head.x
    );
    head.angle = lerpAngle(head.angle, targetAngle, 0.2);

    const amountToEat = EARTHWORM_EAT_RATE * dtFactor;
    const actualEaten = this.eatingTarget.beEaten(amountToEat);

    if (actualEaten > 0) {
      this.hunger = Math.min(
        100,
        this.hunger + actualEaten * FOOD_TO_HUNGER_RATIO
      );
    }

    if (this.eatingTarget.foodAmount <= 0 || this.hunger >= 100) {
      this.isEating = false;
      this.eatingTarget = null;
      this.isMoving = true;
    }
  }

  _move(speedFactor, insects) {
    if (!this.isMoving || this.bodySegments.length === 0) return;
    const head = this.bodySegments[0];
    let targetDirection = head.angle;
    let isEscaping = false;

    if (this.hunger >= FOOD_EAT_HUNGER_THRESHOLD && insects?.length > 0) {
      const escapeThresholdFactor = 0.8;
      const escapeDistanceSq =
        (FOOD_DETECTION_RADIUS * escapeThresholdFactor) ** 2;
      const escapeTurnStrength = 0.15;
      for (const insect of insects) {
        if (!insect || insect.foodAmount <= 0) continue;
        const dx = head.x - insect.x;
        const dy = head.y - insect.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < escapeDistanceSq) {
          const escapeAngle = Math.atan2(dy, dx);
          targetDirection = lerpAngle(
            head.angle,
            escapeAngle,
            escapeTurnStrength
          );
          isEscaping = true;
          break;
        }
      }
    }

    if (!isEscaping && Math.random() < 0.02) {
      const randomTargetAngle =
        head.angle + (Math.random() - 0.5) * EARTHWORM_TURN_RATE;
      targetDirection = lerpAngle(head.angle, randomTargetAngle, 0.05);
    }

    head.angle = targetDirection;

    const swaySpeed = 0.15;
    const swayAmplitude = 0.15;
    const swayOffset =
      Math.sin(simulationState.totalTime * swaySpeed + head.x * 0.01) *
      swayAmplitude;
    const moveDirection = head.angle + swayOffset;
    const speedVariation =
      1 + (Math.random() - 0.5) * EARTHWORM_SPEED_VARIATION;
    const currentSpeed = this.dna.speed * speedFactor * speedVariation;

    head.x += Math.cos(moveDirection) * currentSpeed;
    head.y += Math.sin(moveDirection) * currentSpeed;

    if (head.x < CANVAS_PADDING) head.x = WORLD_WIDTH - CANVAS_PADDING;
    else if (head.x > WORLD_WIDTH - CANVAS_PADDING) head.x = CANVAS_PADDING;
    if (head.y < CANVAS_PADDING) head.y = WORLD_HEIGHT - CANVAS_PADDING;
    else if (head.y > WORLD_HEIGHT - CANVAS_PADDING) head.y = CANVAS_PADDING;
  }

  _findFood(insects) {
    if (
      this.isEating ||
      this.hunger >= FOOD_EAT_HUNGER_THRESHOLD ||
      this.bodySegments.length === 0
    )
      return;

    const head = this.bodySegments[0];
    let closestInsect = null;
    let minDistSq = FOOD_DETECTION_RADIUS * FOOD_DETECTION_RADIUS;

    for (let i = insects.length - 1; i >= 0; i--) {
      const insect = insects[i];
      if (!insect || insect.foodAmount <= 0) {
        if (insect?.foodAmount <= 0) insects.splice(i, 1);
        continue;
      }
      const dx = head.x - insect.x;
      const dy = head.y - insect.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestInsect = insect;
      }
    }

    if (closestInsect) {
      if (minDistSq < EAT_DISTANCE * EAT_DISTANCE) {
        this.isEating = true;
        this.eatingTarget = closestInsect;
        this.isMoving = false;
      } else if (this.hunger < FOOD_SEARCH_HUNGER_THRESHOLD) {
        this.isMoving = true;
        const targetAngle = Math.atan2(
          closestInsect.y - head.y,
          closestInsect.x - head.x
        );
        let angleDiff = targetAngle - head.angle;
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        const turnSpeed = Math.abs(angleDiff) > Math.PI * 0.8 ? 0.05 : 0.1;
        head.angle = lerpAngle(head.angle, targetAngle, turnSpeed);
      }
    }
  }

  draw(ctx) {
    if (this.isDead || this.bodySegments.length === 0) return;
    ctx.save();
    this._drawBodySegments(ctx);
    this._drawHeadDetails(ctx);
    ctx.restore();
  }

  _drawBodySegments(ctx) {
    const colorStep = 5 / this.bodySegments.length;
    for (let i = this.bodySegments.length - 1; i >= 0; i--) {
      const seg = this.bodySegments[i];
      const segmentDrawSize = this.currentSize * 0.4;
      let segmentColor = this.dna.color;
      if (i > 0) {
        segmentColor = darkenColor(
          this.dna.color,
          colorStep * (this.bodySegments.length - 1 - i)
        );
      }
      ctx.fillStyle = segmentColor;
      ctx.save();
      ctx.translate(seg.x, seg.y);
      ctx.rotate(seg.angle);
      ctx.beginPath();
      ctx.arc(0, 0, segmentDrawSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawHeadDetails(ctx) {
    if (this.bodySegments.length === 0) return;
    const head = this.bodySegments[0];
    const headDrawSize = this.currentSize * 0.4;

    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(head.angle);

    let headColor = this.dna.color;
    if (this.isMating) headColor = lightenColor(this.dna.color, 15);
    else if (this.isEating) headColor = darkenColor(this.dna.color, 10);

    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.arc(0, 0, headDrawSize / 2, 0, Math.PI * 2);
    ctx.fill();

    this._drawEyes(ctx, headDrawSize);
    const barOffsetY = -headDrawSize * 0.5 - 12;
    this._drawStatusBars(ctx, barOffsetY);
    this._drawStateIcons(ctx, barOffsetY);

    ctx.restore();
  }

  _drawEyes(ctx, headDrawSize) {
    const eyeSize = Math.max(5, this.currentSize * 0.06);
    const eyeOffsetX = headDrawSize * 0.35;
    const eyeOffsetY = headDrawSize * 0.4;

    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(eyeOffsetX, -eyeOffsetY, eyeSize, 0, Math.PI * 2);
    ctx.arc(eyeOffsetX, eyeOffsetY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    let pupilOffsetX = 0;
    let pupilOffsetY = 0;
    const targetLookPos = this._determineLookTarget();
    if (targetLookPos) {
      const head = this.bodySegments[0];
      const angleToTargetWorld = Math.atan2(
        targetLookPos.y - head.y,
        targetLookPos.x - head.x
      );
      const relativeAngle = angleToTargetWorld - head.angle;
      const normalizedRelativeAngle = Math.atan2(
        Math.sin(relativeAngle),
        Math.cos(relativeAngle)
      );
      const maxPupilOffset = eyeSize * 0.4;
      pupilOffsetX = Math.cos(normalizedRelativeAngle) * maxPupilOffset;
      pupilOffsetY = Math.sin(normalizedRelativeAngle) * maxPupilOffset;
    }

    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(
      eyeOffsetX + pupilOffsetX,
      -eyeOffsetY + pupilOffsetY,
      eyeSize * 0.5,
      0,
      Math.PI * 2
    );
    ctx.arc(
      eyeOffsetX + pupilOffsetX,
      eyeOffsetY + pupilOffsetY,
      eyeSize * 0.5,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    const highlightSize = eyeSize * 0.15;
    const highlightPosX = eyeOffsetX + pupilOffsetX * 0.5 + eyeSize * 0.15;
    const highlightPosYBase = pupilOffsetY * 0.5 - eyeSize * 0.1;
    ctx.beginPath();
    ctx.arc(
      highlightPosX,
      -eyeOffsetY + highlightPosYBase,
      highlightSize,
      0,
      Math.PI * 2
    );
    ctx.arc(
      highlightPosX,
      eyeOffsetY + highlightPosYBase,
      highlightSize,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  _determineLookTarget() {
    const head = this.bodySegments[0];
    if (this.isEating && this.eatingTarget) return this.eatingTarget;
    if (this.isMating && this.matingPartner) {
      try {
        if (this.matingPartner.bodySegments?.length > 0)
          return this.matingPartner.bodySegments[0];
      } catch (e) {
        /* ignore */
      }
    }
    if (this.hunger < FOOD_SEARCH_HUNGER_THRESHOLD) {
      let closestFoodPos = null;
      let minFoodDistSq = FOOD_DETECTION_RADIUS * FOOD_DETECTION_RADIUS * 1.5;
      simulationState.insects.forEach((ins) => {
        if (ins.foodAmount > 0) {
          const foodDx = ins.x - head.x;
          const foodDy = ins.y - head.y;
          const foodDistSq = foodDx * foodDx + foodDy * foodDy;
          if (foodDistSq < minFoodDistSq) {
            minFoodDistSq = foodDistSq;
            closestFoodPos = ins;
          }
        }
      });
      if (closestFoodPos) return closestFoodPos;
    }
    const lookAheadDist = this.currentSize * 0.5;
    return {
      x: head.x + Math.cos(head.angle) * lookAheadDist,
      y: head.y + Math.sin(head.angle) * lookAheadDist,
    };
  }

  _drawStatusBars(ctx, startY) {
    const barWidth = this.currentSize * 0.8;
    const barHeight = 5;
    const barSpacing = 3;
    const barBorderRadius = 2.5;
    let currentBarY = startY;

    if (!this.isAdult && simulationState.showHealthBar) {
      const growthProgress = Math.max(
        0,
        Math.min(
          1,
          (this.currentSize - INITIAL_EARTHWORM_SIZE) /
            (this.dna.size - INITIAL_EARTHWORM_SIZE || 1)
        )
      );
      this._drawBar(
        ctx,
        currentBarY,
        barWidth,
        barHeight,
        barBorderRadius,
        growthProgress,
        "rgba(100, 200, 100, 0.4)",
        "rgba(100, 200, 100, 0.8)"
      );
      currentBarY -= barHeight + barSpacing;
    }
    if (simulationState.showHealthBar) {
      this._drawBar(
        ctx,
        currentBarY,
        barWidth,
        barHeight,
        barBorderRadius,
        this.health / 100,
        "rgba(200, 50, 50, 0.4)",
        "rgba(50, 220, 50, 0.9)"
      );
      currentBarY -= barHeight + barSpacing;
    }
    if (simulationState.showHungerBar) {
      this._drawBar(
        ctx,
        currentBarY,
        barWidth,
        barHeight,
        barBorderRadius,
        this.hunger / 100,
        "rgba(150, 120, 80, 0.4)",
        "rgba(255, 180, 50, 0.9)"
      );
    }
  }

  _drawBar(ctx, y, width, height, radius, progress, bgColor, fgColor) {
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(-width / 2, y, width, height, radius);
    ctx.fill();
    ctx.fillStyle = fgColor;
    ctx.beginPath();
    ctx.roundRect(-width / 2, y, width * Math.max(0, progress), height, radius);
    ctx.fill();
  }

  _drawStateIcons(ctx, barStartY) {
    const headDrawSize = this.currentSize * 0.4;
    let iconY = barStartY - 3;
    if (simulationState.showHungerBar) iconY -= 5 + 3;
    if (simulationState.showHealthBar) iconY -= 5 + 3;
    if (!this.isAdult && simulationState.showHealthBar) iconY -= 5 + 3;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const canTryReproduce =
      !this.isEating &&
      !this.isMating &&
      this.reproductionCooldown <= 0 &&
      this.isAdult &&
      this.hunger >=
        (this.gender === "female"
          ? MIN_HUNGER_TO_REPRODUCE_FEMALE
          : MIN_HUNGER_TO_REPRODUCE_MALE);
    if (canTryReproduce) {
      ctx.font = `bold ${this.currentSize * 0.25}px Arial`;
      ctx.fillStyle = simulationState.reproductionAllowed
        ? this.gender === "female"
          ? "#FF80C0"
          : "#60A0FF"
        : "#AAAAAA";
      ctx.fillText(
        this.gender === "female" ? SYMBOL_FEMALE : SYMBOL_MALE,
        0,
        iconY
      );
    }

    if (this.isMating) {
      ctx.font = `bold ${this.currentSize * 0.35}px Arial`;
      ctx.fillStyle = "rgba(255, 0, 0, 0.85)";
      const heartYOffset = iconY - this.currentSize * 0.1;
      ctx.fillText(EMOJI_HEART, 0, heartYOffset);
    }
  }
}

class Insect {
  constructor(x, y) {
    this.x =
      x ?? Math.random() * (WORLD_WIDTH - CANVAS_PADDING * 2) + CANVAS_PADDING;
    this.y =
      y ?? Math.random() * (WORLD_HEIGHT - CANVAS_PADDING * 2) + CANVAS_PADDING;
    this.maxFoodAmount = INSECT_INITIAL_FOOD;
    this.foodAmount = this.maxFoodAmount;
    this.emojiBaseSize = 28;
  }
  beEaten(amount) {
    const eatenAmount = Math.min(amount, this.foodAmount);
    this.foodAmount -= eatenAmount;
    return eatenAmount;
  }
  draw(ctx) {
    if (this.foodAmount <= 0 || !ctx) return;
    const sizeRatio = Math.max(0.2, this.foodAmount / this.maxFoodAmount);
    const currentFontSize = this.emojiBaseSize * sizeRatio;
    if (currentFontSize < 2) return;
    ctx.font = `${currentFontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(EMOJI_FOOD, this.x, this.y);
  }
}

class Egg {
  constructor(position, parentDNA) {
    this.position = { ...position };
    this.parentDNA = { ...parentDNA };
    this.hatchTimer = EGG_HATCH_TIME;
    this.size = EGG_SIZE;
  }
  update(deltaTime, earthworms) {
    this.hatchTimer -= deltaTime;
    if (this.hatchTimer <= 0) {
      this.hatch(earthworms);
      return true;
    }
    return false;
  }
  hatch(earthworms) {
    const childGender = Math.random() < 0.5 ? "male" : "female";
    const spawnPos = {
      x: this.position.x + (Math.random() * 6 - 3),
      y: this.position.y + (Math.random() * 6 - 3),
    };
    spawnPos.x = Math.max(
      CANVAS_PADDING,
      Math.min(WORLD_WIDTH - CANVAS_PADDING, spawnPos.x)
    );
    spawnPos.y = Math.max(
      CANVAS_PADDING,
      Math.min(WORLD_HEIGHT - CANVAS_PADDING, spawnPos.y)
    );
    earthworms.push(new Earthworm(childGender, spawnPos, this.parentDNA));
  }
  draw(ctx) {
    ctx.fillStyle = EGG_COLOR;
    ctx.strokeStyle = EGG_BORDER_COLOR;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const hatchProgress = Math.max(0, 1 - this.hatchTimer / EGG_HATCH_TIME);
    if (hatchProgress > 0) {
      ctx.fillStyle = "rgba(100, 200, 100, 0.6)";
      ctx.beginPath();
      ctx.moveTo(this.position.x, this.position.y);
      ctx.arc(
        this.position.x,
        this.position.y,
        this.size,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * hatchProgress,
        false
      );
      ctx.closePath();
      ctx.fill();
    }
  }
}

let resizeTimeout;
const resizeCanvas = () => {
  const container = uiManager.getSimulationContainer();
  const canvas = uiManager.getCanvas();
  if (!container || !canvas) {
    console.warn("Cannot resize canvas, container or canvas not found.");
    return;
  }
  try {
    const containerRect = container.getBoundingClientRect();
    const containerStyle = getComputedStyle(container);
    const containerPaddingX =
      parseFloat(containerStyle.paddingLeft) +
      parseFloat(containerStyle.paddingRight);
    const availableWidth = containerRect.width - containerPaddingX;
    let maxWidth = WORLD_WIDTH;
    const maxWidthStyle = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--container-max-width");
    if (maxWidthStyle) {
      try {
        maxWidth = parseFloat(maxWidthStyle) || WORLD_WIDTH;
      } catch (e) {
        console.warn("Could not parse --container-max-width CSS variable.", e);
      }
    }
    const targetWidth = Math.min(availableWidth, maxWidth, WORLD_WIDTH);
    const aspectRatio = WORLD_HEIGHT / WORLD_WIDTH;
    canvas.width = Math.round(targetWidth);
    canvas.height = Math.round(targetWidth * aspectRatio);
    simulationState.scaleFactor = canvas.width / WORLD_WIDTH;
  } catch (error) {
    console.error("Error during canvas resize:", error);
  }
};
const initializeSimulation = () => {
  if (simulationState.animationFrameId) {
    cancelAnimationFrame(simulationState.animationFrameId);
    simulationState.animationFrameId = null;
  }
  simulationState.earthworms = [];
  simulationState.insects = [];
  simulationState.eggs = [];
  simulationState.totalTime = 0;
  simulationState.maxEarthwormCount = 0;
  simulationState.isRunning = true;
  simulationState.reproductionAllowed = true;
  simulationState.survivalTimer = 0;
  simulationState.lastTimestamp = 0;
  uiManager.updateSurvivalGauge(0);
  uiManager.updateTimer(0);
  uiManager.showRestartButton(false);
  uiManager.clearCanvas();
  for (let i = 0; i < INITIAL_EARTHWORMS; i++) {
    const gender = Math.random() < 0.5 ? "male" : "female";
    const position = {
      x: Math.random() * (WORLD_WIDTH - CANVAS_PADDING * 2) + CANVAS_PADDING,
      y: Math.random() * (WORLD_HEIGHT - CANVAS_PADDING * 2) + CANVAS_PADDING,
    };
    simulationState.earthworms.push(new Earthworm(gender, position));
  }
  for (let i = 0; i < Math.min(MAX_INSECTS, 2); i++) {
    addRandomFood();
  }
  uiManager.updateCounts(
    simulationState.earthworms.length,
    simulationState.maxEarthwormCount,
    simulationState.insects.length,
    simulationState.eggs.length
  );
  if (!simulationState.animationFrameId && simulationState.isRunning) {
    simulationState.animationFrameId = requestAnimationFrame(animate);
  }
};
function addBonusEarthworm() {
  if (
    !simulationState.isRunning ||
    simulationState.earthworms.length >= REPRODUCTION_LIMIT_HIGH
  )
    return;
  const gender = Math.random() < 0.5 ? "male" : "female";
  const position = {
    x: Math.random() * (WORLD_WIDTH - CANVAS_PADDING * 2) + CANVAS_PADDING,
    y: Math.random() * (WORLD_HEIGHT - CANVAS_PADDING * 2) + CANVAS_PADDING,
  };
  simulationState.earthworms.push(new Earthworm(gender, position));
}
function addFoodAt(worldX, worldY) {
  if (!simulationState.isRunning) return;
  if (simulationState.insects.length >= MAX_INSECTS) {
    return false;
  }
  if (
    worldX >= CANVAS_PADDING &&
    worldX <= WORLD_WIDTH - CANVAS_PADDING &&
    worldY >= CANVAS_PADDING &&
    worldY <= WORLD_HEIGHT - CANVAS_PADDING
  ) {
    simulationState.insects.push(new Insect(worldX, worldY));
    uiManager.updateCounts(
      simulationState.earthworms.length,
      simulationState.maxEarthwormCount,
      simulationState.insects.length,
      simulationState.eggs.length
    );
    return true;
  } else {
    return false;
  }
}
function addRandomFood() {
  const x = Math.random() * (WORLD_WIDTH - CANVAS_PADDING * 2) + CANVAS_PADDING;
  const y =
    Math.random() * (WORLD_HEIGHT - CANVAS_PADDING * 2) + CANVAS_PADDING;
  return addFoodAt(x, y);
}

const animate = (timestamp) => {
  if (!simulationState.isRunning || !uiManager.getContext()) {
    return;
  }
  if (!simulationState.lastTimestamp) {
    simulationState.lastTimestamp = timestamp;
    simulationState.animationFrameId = requestAnimationFrame(animate);
    return;
  }
  const deltaTime = timestamp - simulationState.lastTimestamp;
  simulationState.lastTimestamp = timestamp;

  simulationState.totalTime += deltaTime;
  simulationState.survivalTimer += deltaTime;
  if (simulationState.survivalTimer >= SURVIVAL_BONUS_TIME) {
    addBonusEarthworm();
    simulationState.survivalTimer = 0;
  }

  const currentWormCount = simulationState.earthworms.length;
  if (currentWormCount > simulationState.maxEarthwormCount) {
    simulationState.maxEarthwormCount = currentWormCount;
  }
  if (
    currentWormCount >= REPRODUCTION_LIMIT_HIGH &&
    simulationState.reproductionAllowed
  ) {
    simulationState.reproductionAllowed = false;
  } else if (
    currentWormCount < REPRODUCTION_LIMIT_LOW &&
    !simulationState.reproductionAllowed
  ) {
    simulationState.reproductionAllowed = true;
  }

  for (let i = simulationState.insects.length - 1; i >= 0; i--) {
    if (simulationState.insects[i].foodAmount <= 0) {
      simulationState.insects.splice(i, 1);
    }
  }
  for (let i = simulationState.eggs.length - 1; i >= 0; i--) {
    if (simulationState.eggs[i].update(deltaTime, simulationState.earthworms)) {
      simulationState.eggs.splice(i, 1);
    }
  }
  simulationState.earthworms.forEach((worm) => {
    worm.update(
      deltaTime,
      simulationState.insects,
      simulationState.earthworms,
      simulationState.eggs
    );
  });
  simulationState.earthworms = simulationState.earthworms.filter(
    (worm) => !worm.isDead
  );

  uiManager.clearCanvas();
  const ctx = uiManager.getContext();
  ctx.save();
  ctx.scale(simulationState.scaleFactor, simulationState.scaleFactor);
  simulationState.insects.forEach((insect) => insect.draw(ctx));
  simulationState.eggs.forEach((egg) => egg.draw(ctx));
  simulationState.earthworms.forEach((worm) => worm.draw(ctx));
  ctx.restore();

  uiManager.updateCounts(
    simulationState.earthworms.length,
    simulationState.maxEarthwormCount,
    simulationState.insects.length,
    simulationState.eggs.length
  );
  uiManager.updateTimer(simulationState.totalTime);
  uiManager.updateSurvivalGauge(simulationState.survivalTimer);

  if (
    simulationState.earthworms.length === 0 &&
    simulationState.eggs.length === 0 &&
    simulationState.totalTime > 5000
  ) {
    simulationState.isRunning = false;

    uiManager.showRestartButton(true);
  }

  if (simulationState.isRunning) {
    simulationState.animationFrameId = requestAnimationFrame(animate);
  } else {
    if (simulationState.animationFrameId) {
      cancelAnimationFrame(simulationState.animationFrameId);
      simulationState.animationFrameId = null;
    }
  }
};

const handleCanvasClick = (e) => {
  const canvas = uiManager.getCanvas();
  if (!simulationState.isRunning || !canvas) return;
  try {
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const worldX = canvasX / simulationState.scaleFactor;
    const worldY = canvasY / simulationState.scaleFactor;
    addFoodAt(worldX, worldY);
  } catch (error) {
    console.error("Error handling canvas click:", error);
  }
};
const handleAddFoodClick = () => {
  addRandomFood();
};
const handleRestartClick = () => {
  initializeSimulation();
};
const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    resizeCanvas();
  }, 200);
};
const handleKeyDown = (e) => {
  const key = e.key.toLowerCase();
  if (key === "h") {
    simulationState.showHealthBar = !simulationState.showHealthBar;
  } else if (key === "u") {
    simulationState.showHungerBar = !simulationState.showHungerBar;
  }
};

const cleanup = () => {
  simulationState.isRunning = false;
  if (simulationState.animationFrameId) {
    cancelAnimationFrame(simulationState.animationFrameId);
    simulationState.animationFrameId = null;
  }
  uiManager.removeEventListeners();
};

window.addEventListener("DOMContentLoaded", () => {
  if (!uiManager.init()) {
    return;
  }
  uiManager.setupEventListeners();
  resizeCanvas();
  initializeSimulation();
});
