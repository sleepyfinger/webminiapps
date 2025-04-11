const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;
const CANVAS_PADDING = 30;
const HUNGER_DECREASE_RATE = 0.15;
const HEALTH_DECREASE_RATE_HUNGER = 1.2;
const REPRODUCTION_COOLDOWN_FEMALE = 12000;
const REPRODUCTION_COOLDOWN_MALE = 6000;
const MIN_HUNGER_TO_REPRODUCE_FEMALE = 85;
const MIN_HUNGER_TO_REPRODUCE_MALE = 75;
const EAT_DISTANCE = 30;
const REPRODUCTION_DISTANCE = 55;
const INITIAL_EARTHWORMS = 5;
const MUTATION_RATE = 0.15;
const BODY_SEGMENT_COUNT = 12;
const EARTHWORM_COLOR_MALE = "#FFB6C1";
const EARTHWORM_COLOR_FEMALE = "#E6E6FA";
const EARTHWORM_TURN_RATE = 0.8;
const EARTHWORM_SEGMENT_FOLLOW_SPEED = 0.2;
const EARTHWORM_MOVEMENT_CHANCE = 0.7;
const EARTHWORM_SPEED_VARIATION = 0.5;
const REPRODUCTION_LIMIT_HIGH = 100;
const REPRODUCTION_LIMIT_LOW = 30;
const INSECT_INITIAL_FOOD = 500;
const EARTHWORM_EAT_RATE = 1.5;
const FOOD_TO_HUNGER_RATIO = 0.8;
const FOOD_SEARCH_HUNGER_THRESHOLD = 90;
const FOOD_EAT_HUNGER_THRESHOLD = 95;
const MAX_INSECTS = 3;

const MATING_DURATION = 3500;
const EGG_HATCH_TIME = 8000;
const EGG_SIZE = 8;
const EGG_COLOR = "#FFFACD";
const EGG_BORDER_COLOR = "#D2B48C";
const MATING_ORBIT_SPEED = 0.002;
const MATING_ORBIT_RADIUS_FACTOR = 0.12;

const INITIAL_EARTHWORM_SIZE = 8;
const ADULT_EARTHWORM_SIZE = 18;
const GROWTH_RATE = 0.001;

const FOOD_DETECTION_RADIUS = 100;

let canvas, ctx, restartButton, simulationContainer, addFoodButton;
let earthworms = [];
let insects = [];
let eggs = [];
let lastTimestamp = 0;
let simulationRunning = true;
let totalSimulationTime = 0;
let animationFrameId = null;
let scaleFactor = 1;
let reproductionAllowed = true;
let showHealthBar = false;
let showHungerBar = false;
let resizeTimeout;
let maxEarthwormCount = 0;

const distance = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
const mutateValue = (value) =>
  value * (1 + (Math.random() - 0.5) * 2 * MUTATION_RATE);
const getRandomColor = () => `hsl(${Math.random() * 360}, 70%, 60%)`;
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
    this.gender = gender;
    this.position = { ...position };
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
    this.isMoving = Math.random() < EARTHWORM_MOVEMENT_CHANCE;

    const baseSpeed = dna.speed || Math.random() * 1.2 + 0.8;
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
    this.direction = Math.random() * Math.PI * 2;
    this.generateBody();
  }

  generateBody() {
    this.bodySegments = [];
    for (let i = 0; i < BODY_SEGMENT_COUNT; i++) {
      const offset = i * this.dna.size * 0.2;
      this.bodySegments.push({
        x: this.position.x - Math.cos(this.direction) * offset,
        y: this.position.y - Math.sin(this.direction) * offset,
        angle: this.direction,
      });
    }
  }

  update(deltaTime, insects, earthworms, eggs) {
    if (this.isDead) return;

    if (!this.isAdult) {
      this.currentSize = Math.min(
        this.dna.size,
        this.currentSize + GROWTH_RATE * deltaTime
      );
      if (this.currentSize >= this.dna.size * 0.8) {
        this.isAdult = true;
      }
    }

    if (this.isMating) {
      this.handleMating(deltaTime, eggs);
      if (this.isMating) {
        this.updateBody();
        return;
      }
    }

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
      if (this.matingPartner && this.matingPartner.isMating) {
        this.matingPartner.stopMating();
      }
      return;
    }

    if (this.isEating) {
      this.eat(deltaTime, dtFactor);
      if (this.isEating) {
        this.updateBody();
        return;
      }
    }

    this.findFood(insects);
    if (!this.isEating) {
      this.checkReproduction(earthworms);
      if (!this.isMating) {
        this.move(dtFactor);
      }
    }

    this.updateBody();
  }

  handleMating(deltaTime, eggs) {
    this.matingTimer -= deltaTime;

    if (
      !this.matingPartner ||
      this.matingPartner.isDead ||
      !this.matingPartner.isMating ||
      this.matingPartner.matingPartner !== this ||
      !this.matingOrbitData
    ) {
      this.stopMating();
      return;
    }

    const midX = (this.position.x + this.matingPartner.position.x) / 2;
    const midY = (this.position.y + this.matingPartner.position.y) / 2;
    const radius = this.matingOrbitData.radius;

    const dx = this.matingPartner.position.x - this.position.x;
    const dy = this.matingPartner.position.y - this.position.y;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);

    const targetDistance = radius * 1.5;

    const distanceAdjustSpeed = 0.015;
    const adjustedRadius =
      radius + (targetDistance - currentDistance) * distanceAdjustSpeed;

    const baseSpeed = MATING_ORBIT_SPEED * deltaTime;
    const speedVariation = Math.sin(totalSimulationTime * 0.001) * 0.1;
    const angleIncrement = baseSpeed * (1 + speedVariation);
    this.matingOrbitData.currentAngle =
      (this.matingOrbitData.currentAngle + angleIncrement) % (Math.PI * 2);

    const waveOffset = Math.sin(totalSimulationTime * 0.002) * 0.05;
    const newX =
      midX +
      adjustedRadius * Math.cos(this.matingOrbitData.currentAngle + waveOffset);
    const newY =
      midY +
      adjustedRadius * Math.sin(this.matingOrbitData.currentAngle + waveOffset);

    const moveAngle = Math.atan2(
      newY - this.position.y,
      newX - this.position.x
    );

    this.position.x = Math.max(
      CANVAS_PADDING,
      Math.min(WORLD_WIDTH - CANVAS_PADDING, newX)
    );
    this.position.y = Math.max(
      CANVAS_PADDING,
      Math.min(WORLD_HEIGHT - CANVAS_PADDING, newY)
    );

    this.direction = lerpAngle(this.direction, moveAngle, 0.2);

    if (this.matingTimer <= 0) {
      this.layEgg(eggs);
      this.stopMating(true);
    }
  }

  stopMating(normalCompletion = false) {
    if (this.isMating) {
      const partner = this.matingPartner;
      this.isMating = false;
      this.matingTimer = 0;
      this.matingPartner = null;
      this.matingOrbitData = null;
      if (normalCompletion) {
        this.reproductionCooldown =
          this.gender === "female"
            ? REPRODUCTION_COOLDOWN_FEMALE
            : REPRODUCTION_COOLDOWN_MALE;
      }
      if (partner && partner.isMating && partner.matingPartner === this) {
        partner.stopMating(normalCompletion);
      }
    }
  }

  layEgg(eggs) {
    if (!this.matingPartner) return;

    const childDNA = {
      speed: (this.dna.speed + this.matingPartner.dna.speed) / 2,
      size: (this.dna.size + this.matingPartner.dna.size) / 2,
      offspringCount: Math.round(
        (this.dna.offspringCount + this.matingPartner.dna.offspringCount) / 2
      ),
    };

    const random = Math.random();
    if (random < 0.6) {
      this.eggCount = 1;
    } else if (random < 0.85) {
      this.eggCount = 2;
    } else if (random < 0.95) {
      this.eggCount = 3;
    } else {
      this.eggCount = Math.floor(Math.random() * 2) + 4;
    }

    for (let i = 0; i < this.eggCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 20;
      const eggPos = {
        x: Math.max(
          CANVAS_PADDING + EGG_SIZE,
          Math.min(
            WORLD_WIDTH - CANVAS_PADDING - EGG_SIZE,
            this.position.x + Math.cos(angle) * distance
          )
        ),
        y: Math.max(
          CANVAS_PADDING + EGG_SIZE,
          Math.min(
            WORLD_HEIGHT - CANVAS_PADDING - EGG_SIZE,
            this.position.y + Math.sin(angle) * distance
          )
        ),
      };

      eggs.push(new Egg(eggPos, childDNA));
    }
  }

  eat(deltaTime, dtFactor) {
    if (
      !this.eatingTarget ||
      this.eatingTarget.foodAmount <= 0 ||
      this.hunger >= 100
    ) {
      this.isEating = false;
      this.eatingTarget = null;
      return;
    }

    const distSq =
      (this.position.x - this.eatingTarget.x) ** 2 +
      (this.position.y - this.eatingTarget.y) ** 2;
    if (distSq > (EAT_DISTANCE * 1.2) ** 2) {
      this.isEating = false;
      this.eatingTarget = null;
      return;
    }

    const targetAngle = Math.atan2(
      this.eatingTarget.y - this.position.y,
      this.eatingTarget.x - this.position.x
    );
    this.direction = lerpAngle(this.direction, targetAngle, 0.2);

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
    }
  }

  move(speedFactor) {
    const baseDirection = this.direction;

    const swaySpeed = 0.1;
    const swayAmplitude = 0.2;
    const swayOffset = Math.sin(totalSimulationTime * swaySpeed) * swayAmplitude;
    const swayDirection = baseDirection + swayOffset;

    const distToLeft = this.position.x - CANVAS_PADDING;
    const distToRight = WORLD_WIDTH - CANVAS_PADDING - this.position.x;
    const distToTop = this.position.y - CANVAS_PADDING;
    const distToBottom = WORLD_HEIGHT - CANVAS_PADDING - this.position.y;

    const boundaryThreshold = 50;
    let boundaryInfluence = 0;

    if (distToLeft < boundaryThreshold) {
      boundaryInfluence = (boundaryThreshold - distToLeft) / boundaryThreshold;
      this.direction = lerpAngle(this.direction, 0, boundaryInfluence * 0.1);
    } else if (distToRight < boundaryThreshold) {
      boundaryInfluence = (boundaryThreshold - distToRight) / boundaryThreshold;
      this.direction = lerpAngle(
        this.direction,
        Math.PI,
        boundaryInfluence * 0.1
      );
    }

    if (distToTop < boundaryThreshold) {
      boundaryInfluence = (boundaryThreshold - distToTop) / boundaryThreshold;
      this.direction = lerpAngle(
        this.direction,
        Math.PI / 2,
        boundaryInfluence * 0.1
      );
    } else if (distToBottom < boundaryThreshold) {
      boundaryInfluence =
        (boundaryThreshold - distToBottom) / boundaryThreshold;
      this.direction = lerpAngle(
        this.direction,
        -Math.PI / 2,
        boundaryInfluence * 0.1
      );
    }

    if (Math.random() < 0.01 && boundaryInfluence < 0.5) {
      const targetAngle =
        this.direction + (Math.random() - 0.5) * EARTHWORM_TURN_RATE * 0.5;
      this.direction = lerpAngle(this.direction, targetAngle, 0.03);
    }

    const speedVariation =
      1 + (Math.random() - 0.5) * EARTHWORM_SPEED_VARIATION;
    const currentSpeed = this.dna.speed * speedFactor * speedVariation;

    this.position.x += Math.cos(swayDirection) * currentSpeed;
    this.position.y += Math.sin(swayDirection) * currentSpeed;

    let bounced = false;
    if (this.position.x < CANVAS_PADDING) {
      this.position.x = CANVAS_PADDING;
      this.direction = lerpAngle(this.direction, Math.PI - this.direction, 0.1);
      bounced = true;
    } else if (this.position.x > WORLD_WIDTH - CANVAS_PADDING) {
      this.position.x = WORLD_WIDTH - CANVAS_PADDING;
      this.direction = lerpAngle(this.direction, Math.PI - this.direction, 0.1);
      bounced = true;
    }
    if (this.position.y < CANVAS_PADDING) {
      this.position.y = CANVAS_PADDING;
      this.direction = lerpAngle(this.direction, -this.direction, 0.1);
      bounced = true;
    } else if (this.position.y > WORLD_HEIGHT - CANVAS_PADDING) {
      this.position.y = WORLD_HEIGHT - CANVAS_PADDING;
      this.direction = lerpAngle(this.direction, -this.direction, 0.1);
      bounced = true;
    }
    if (bounced) {
      this.direction = lerpAngle(
        this.direction,
        this.direction + (Math.random() - 0.5) * 0.2,
        0.05
      );
    }
  }

  updateBody() {
    if (this.bodySegments.length === 0) return;

    const head = this.bodySegments[0];
    head.x = this.position.x;
    head.y = this.position.y;
    head.angle = this.direction;

    const waveFrequency = 0.05;
    const waveAmplitude = 0.1 * (1 - this.currentSize / (this.dna.size * 2));

    for (let i = 1; i < this.bodySegments.length; i++) {
      const prev = this.bodySegments[i - 1];
      const current = this.bodySegments[i];

      const segmentWaveFrequency = waveFrequency * (1 + i * 0.01);
      const waveOffset =
        Math.sin(totalSimulationTime * segmentWaveFrequency + i * 0.1) *
        waveAmplitude;

      const targetAngle =
        Math.atan2(prev.y - current.y, prev.x - current.x) + waveOffset;

      const segmentFollowSpeed =
        EARTHWORM_SEGMENT_FOLLOW_SPEED *
        (1 - i / (this.bodySegments.length * 4));
      current.angle = lerpAngle(current.angle, targetAngle, segmentFollowSpeed);

      const segmentLength = this.currentSize * 0.1;
      current.x = prev.x - Math.cos(current.angle) * segmentLength;
      current.y = prev.y - Math.sin(current.angle) * segmentLength;
    }
  }

  findFood(insects) {
    if (this.hunger >= FOOD_EAT_HUNGER_THRESHOLD) return;

    let closestInsect = null;
    let minDistSq = Infinity;

    for (let i = insects.length - 1; i >= 0; i--) {
      const insect = insects[i];
      if (!insect || insect.foodAmount <= 0) {
        if (insect && insect.foodAmount <= 0) insects.splice(i, 1);
        continue;
      }
      const dx = this.position.x - insect.x;
      const dy = this.position.y - insect.y;
      const dSq = dx * dx + dy * dy;
      
      if (dSq < FOOD_DETECTION_RADIUS * FOOD_DETECTION_RADIUS) {
        if (dSq < minDistSq) {
          minDistSq = dSq;
          closestInsect = insect;
        }
      }
    }

    if (closestInsect) {
      if (minDistSq < EAT_DISTANCE * EAT_DISTANCE) {
        this.isEating = true;
        this.eatingTarget = closestInsect;
      } else if (this.hunger < FOOD_SEARCH_HUNGER_THRESHOLD) {
        const targetAngle = Math.atan2(
          closestInsect.y - this.position.y,
          closestInsect.x - this.position.x
        );
        
        let angleDiff = targetAngle - this.direction;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) > Math.PI / 2) {
          this.direction = lerpAngle(this.direction, targetAngle + Math.PI, 0.1);
        } else {
          this.direction = lerpAngle(this.direction, targetAngle, 0.1);
        }
      }
    }
  }

  checkReproduction(earthworms) {
    if (
      this.isMating ||
      this.isEating ||
      !reproductionAllowed ||
      this.reproductionCooldown > 0 ||
      !this.isAdult
    ) {
      return;
    }

    if (
      this.gender !== "female" ||
      this.hunger < MIN_HUNGER_TO_REPRODUCE_FEMALE
    ) {
      return;
    }

    const partner = earthworms.find((r) => {
      if (
        r.isDead ||
        r.isEating ||
        r.isMating ||
        r.gender !== "male" ||
        r === this ||
        r.reproductionCooldown > 0 ||
        r.hunger < MIN_HUNGER_TO_REPRODUCE_MALE ||
        !r.isAdult
      ) {
        return false;
      }
      const dx = this.position.x - r.position.x;
      const dy = this.position.y - r.position.y;
      return dx * dx + dy * dy < REPRODUCTION_DISTANCE ** 2;
    });

    if (partner) {
      this.startMating(partner);
      partner.startMating(this);
    }
  }

  startMating(partner) {
    this.isMating = true;
    this.matingPartner = partner;
    this.matingTimer = MATING_DURATION;
    this.isEating = false;
    this.eatingTarget = null;
    this.hunger -= 15;

    const dx = partner.position.x - this.position.x;
    const dy = partner.position.y - this.position.y;
    const initialDistance = Math.max(5, Math.sqrt(dx * dx + dy * dy));
    const orbitRadius = initialDistance * MATING_ORBIT_RADIUS_FACTOR * 1.5;

    const initialAngle = Math.atan2(dy, dx);
    this.matingOrbitData = {
      radius: orbitRadius,
      currentAngle: initialAngle,
    };
  }

  draw(ctx) {
    if (this.isDead) return;

    if (!this.gradientCache) {
      this.gradientCache = ctx.createLinearGradient(
        0,
        0,
        0,
        this.currentSize * 2
      );
      this.gradientCache.addColorStop(0, lightenColor(this.dna.color, 15));
      this.gradientCache.addColorStop(0.5, this.dna.color);
      this.gradientCache.addColorStop(1, darkenColor(this.dna.color, 10));
    }

    for (let i = this.bodySegments.length - 1; i >= 0; i--) {
      const seg = this.bodySegments[i];
      const sizeFactor = 1 - i / (this.bodySegments.length * 1.5);
      const segmentWidth = this.currentSize * 0.4 * sizeFactor;
      const segmentLength = this.currentSize * 0.8 * sizeFactor;

      ctx.save();
      ctx.translate(seg.x, seg.y);
      ctx.rotate(seg.angle);

      const gradient = this.gradientCache;
      ctx.fillStyle = gradient;
      ctx.strokeStyle = darkenColor(this.dna.color, 20);
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.ellipse(0, 0, segmentLength / 2, segmentWidth / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (i === 0) {
        const eyeSize = Math.max(2, this.currentSize * 0.1);
        const eyeOffsetX = segmentLength * 0.3;
        const eyeOffsetY = segmentWidth * 0.4;

        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(eyeOffsetX, -eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.arc(eyeOffsetX, eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        let pupilOffsetX = eyeSize * 0.1;
        let pupilOffsetY = 0;
        let targetLookPos = null;

        if (this.isEating && this.eatingTarget) {
          targetLookPos = this.eatingTarget;
        } else if (
          this.isMating &&
          this.matingPartner &&
          this.matingPartner.bodySegments.length > 0
        ) {
          targetLookPos = this.matingPartner.bodySegments[0];
        }

        if (targetLookPos) {
          const angleToTarget = Math.atan2(
            targetLookPos.y - seg.y,
            targetLookPos.x - seg.x
          );
          const relativeAngle = angleToTarget - seg.angle;
          pupilOffsetX = eyeSize * 0.3 * Math.cos(relativeAngle);
          pupilOffsetY = eyeSize * 0.3 * Math.sin(relativeAngle);
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

        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(
          eyeOffsetX + pupilOffsetX * 0.3 + eyeSize * 0.2,
          -eyeOffsetY + pupilOffsetY * 0.3 - eyeSize * 0.15,
          eyeSize * 0.15,
          0,
          Math.PI * 2
        );
        ctx.arc(
          eyeOffsetX + pupilOffsetX * 0.3 + eyeSize * 0.2,
          eyeOffsetY + pupilOffsetY * 0.3 - eyeSize * 0.15,
          eyeSize * 0.15,
          0,
          Math.PI * 2
        );
        ctx.fill();

        const barWidth = this.currentSize * 1.5;
        const barHeight = 4;
        const barOffsetY = -segmentWidth * 0.5 - 10;
        const barBorderRadius = 2;
        let currentBarY = barOffsetY;
        let symbolYOffset = barOffsetY - 2;

        if (!this.isAdult && showHealthBar) {
          ctx.fillStyle = "rgba(100, 200, 100, 0.4)";
          ctx.beginPath();
          ctx.roundRect(
            -barWidth / 2,
            currentBarY,
            barWidth,
            barHeight,
            barBorderRadius
          );
          ctx.fill();
          ctx.fillStyle = "rgba(100, 200, 100, 0.8)";
          ctx.beginPath();
          ctx.roundRect(
            -barWidth / 2,
            currentBarY,
            barWidth * (this.currentSize / this.dna.size),
            barHeight,
            barBorderRadius
          );
          ctx.fill();
          currentBarY += barHeight + 2;
        }

        if (showHealthBar) {
          ctx.fillStyle = "rgba(255, 50, 50, 0.4)";
          ctx.beginPath();
          ctx.roundRect(
            -barWidth / 2,
            currentBarY,
            barWidth,
            barHeight,
            barBorderRadius
          );
          ctx.fill();
          ctx.fillStyle = "rgba(50, 220, 50, 0.8)";
          ctx.beginPath();
          ctx.roundRect(
            -barWidth / 2,
            currentBarY,
            barWidth * (this.health / 100),
            barHeight,
            barBorderRadius
          );
          ctx.fill();
          symbolYOffset = currentBarY - 2;
          currentBarY += barHeight + 2;
        }
        if (showHungerBar) {
          ctx.fillStyle = "rgba(120, 120, 120, 0.4)";
          ctx.beginPath();
          ctx.roundRect(
            -barWidth / 2,
            currentBarY,
            barWidth,
            barHeight,
            barBorderRadius
          );
          ctx.fill();
          ctx.fillStyle = "rgba(255, 220, 50, 0.8)";
          ctx.beginPath();
          ctx.roundRect(
            -barWidth / 2,
            currentBarY,
            barWidth * (this.hunger / 100),
            barHeight,
            barBorderRadius
          );
          ctx.fill();
          if (!showHealthBar) {
            symbolYOffset = currentBarY - 2;
          }
          currentBarY += barHeight + 2;
        }

        const canTryReproduce =
          !this.isEating &&
          !this.isMating &&
          this.reproductionCooldown <= 0 &&
          this.isAdult &&
          ((this.gender === "female" &&
            this.hunger >= MIN_HUNGER_TO_REPRODUCE_FEMALE) ||
            (this.gender === "male" &&
              this.hunger >= MIN_HUNGER_TO_REPRODUCE_MALE));
        if (canTryReproduce) {
          ctx.font = `bold ${this.currentSize * 0.8}px Arial`;
          ctx.fillStyle = reproductionAllowed
            ? this.gender === "female"
              ? "#FF80C0"
              : "#60A0FF"
            : "#888888";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(this.gender === "female" ? "♀" : "♂", 0, symbolYOffset);
        }

        if (this.isMating) {
          ctx.font = `bold ${this.currentSize * 1.1}px Arial`;
          ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const heartYOffset =
            showHealthBar || showHungerBar
              ? symbolYOffset - this.currentSize * 0.6
              : barOffsetY - barHeight - 3;
          ctx.fillText("❤️", 0, heartYOffset);
        }
      }
      ctx.restore();
    }
  }
}

class Insect {
  constructor(x, y) {
    this.x = x !== undefined ? x : Math.random() * (WORLD_WIDTH - CANVAS_PADDING * 2) + CANVAS_PADDING;
    this.y = y !== undefined ? y : Math.random() * (WORLD_HEIGHT - CANVAS_PADDING * 2) + CANVAS_PADDING;
    this.baseSize = Math.random() * 4 + 25;
    this.color = getRandomColor();
    this.maxFoodAmount = INSECT_INITIAL_FOOD;
    this.foodAmount = this.maxFoodAmount;
  }
  update(deltaTime) {}
  beEaten(amount) {
    const eatenAmount = Math.min(amount, this.foodAmount);
    this.foodAmount -= eatenAmount;
    return eatenAmount;
  }
  draw(ctx) {
    if (this.foodAmount <= 0 || !ctx) return;
    const currentSize = this.baseSize * (this.foodAmount / this.maxFoodAmount);
    if (currentSize < 1) return;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = Math.max(2, 8 * (this.foodAmount / this.maxFoodAmount));
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

class Egg {
  constructor(position, parentDNA) {
    this.position = { ...position };
    this.parentDNA = { ...parentDNA };
    this.hatchTimer = EGG_HATCH_TIME;
    this.size = EGG_SIZE;
    const random = Math.random();
    if (random < 0.6) {
      this.eggCount = 1;
    } else if (random < 0.85) {
      this.eggCount = 2;
    } else if (random < 0.95) {
      this.eggCount = 3;
    } else {
      this.eggCount = Math.floor(Math.random() * 2) + 4;
    }
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
      x: this.position.x + Math.random() * 4 - 2,
      y: this.position.y + Math.random() * 4 - 2,
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
    const hatchProgress = 1 - this.hatchTimer / EGG_HATCH_TIME;
    if (hatchProgress > 0) {
      ctx.fillStyle = "rgba(100, 200, 100, 0.5)";
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
      ctx.lineTo(this.position.x, this.position.y);
      ctx.fill();
    }
  }
}

const resizeCanvas = () => {
  if (!simulationContainer || !canvas) {
    return;
  }
  const containerRect = simulationContainer.getBoundingClientRect();
  const containerStyle = getComputedStyle(simulationContainer);
  const containerPaddingX =
    parseFloat(containerStyle.paddingLeft) +
    parseFloat(containerStyle.paddingRight);
  const availableWidth = containerRect.width - containerPaddingX;
  const maxWidth =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--container-max-width"
      )
    ) || WORLD_WIDTH;
  const targetWidth = Math.min(availableWidth, maxWidth, WORLD_WIDTH);
  const aspectRatio = WORLD_HEIGHT / WORLD_WIDTH;
  canvas.width = Math.round(targetWidth);
  canvas.height = Math.round(targetWidth * aspectRatio);
  scaleFactor = canvas.width / WORLD_WIDTH;
};

const initializeSimulation = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  const earthwormCountEl = document.getElementById("earthwormCount");
  const maxEarthwormCountEl = document.getElementById("maxEarthwormCount");
  if (!canvas || !ctx || !restartButton || !earthwormCountEl || !maxEarthwormCountEl) {
    console.error("Initialization failed: Required DOM elements not found.");
    canvas = document.getElementById("simulationCanvas");
    ctx = canvas ? canvas.getContext("2d") : null;
    restartButton = document.getElementById("restartButton");
    const tempEarthwormEl = document.getElementById("earthwormCount");
    const tempMaxEarthwormEl = document.getElementById("maxEarthwormCount");
    if (!canvas || !ctx || !restartButton || !tempEarthwormEl || !tempMaxEarthwormEl) {
      console.error("Fatal: Cannot proceed with initialization.");
      return;
    }
    earthwormCountEl = tempEarthwormEl;
    maxEarthwormCountEl = tempMaxEarthwormEl;
  }

  earthworms = [];
  insects = [];
  eggs = [];
  totalSimulationTime = 0;
  maxEarthwormCount = 0;
  simulationRunning = true;
  reproductionAllowed = true;
  restartButton.classList.add("hidden");
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < INITIAL_EARTHWORMS; i++) {
    const gender = Math.random() < 0.5 ? "male" : "female";
    const position = {
      x: Math.random() * (WORLD_WIDTH - CANVAS_PADDING * 2) + CANVAS_PADDING,
      y: Math.random() * (WORLD_HEIGHT - CANVAS_PADDING * 2) + CANVAS_PADDING,
    };
    earthworms.push(new Earthworm(gender, position));
  }

  lastTimestamp = performance.now();
  if (earthwormCountEl) earthwormCountEl.textContent = earthworms.length;
  animationFrameId = requestAnimationFrame(animate);
};

const animate = (timestamp) => {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaTime = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (simulationRunning) {
    totalSimulationTime += deltaTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentEarthwormCount = earthworms.length;
    if (currentEarthwormCount > maxEarthwormCount) {
      maxEarthwormCount = currentEarthwormCount;
      const maxEarthwormCountEl = document.getElementById("maxEarthwormCount");
      if (maxEarthwormCountEl) maxEarthwormCountEl.textContent = maxEarthwormCount;
    }

    if (
      currentEarthwormCount >= REPRODUCTION_LIMIT_HIGH &&
      reproductionAllowed
    ) {
      reproductionAllowed = false;
    } else if (
      currentEarthwormCount < REPRODUCTION_LIMIT_LOW &&
      !reproductionAllowed
    ) {
      reproductionAllowed = true;
    }

    ctx.save();
    ctx.scale(scaleFactor, scaleFactor);

    for (let i = insects.length - 1; i >= 0; i--) {
      if (insects[i].foodAmount <= 0) {
        insects.splice(i, 1);
      } else {
        insects[i].draw(ctx);
      }
    }
    for (let i = eggs.length - 1; i >= 0; i--) {
      if (eggs[i].update(deltaTime, earthworms)) {
        eggs.splice(i, 1);
      } else {
        eggs[i].draw(ctx);
      }
    }
    for (let i = earthworms.length - 1; i >= 0; i--) {
      earthworms[i].update(deltaTime, insects, earthworms, eggs);
    }
    earthworms = earthworms.filter((worm) => !worm.isDead);
    earthworms.forEach((earthworm) => earthworm.draw(ctx));

    ctx.restore();

    const earthwormCountEl = document.getElementById("earthwormCount");
    const foodCountEl = document.getElementById("foodCount");
    const eggCountEl = document.getElementById("eggCount");
    
    if (earthwormCountEl) earthwormCountEl.textContent = earthworms.length;
    if (foodCountEl) foodCountEl.textContent = insects.length;
    if (eggCountEl) eggCountEl.textContent = eggs.length;

    if (
      earthworms.length === 0 &&
      eggs.length === 0 &&
      totalSimulationTime > 3000
    ) {
      simulationRunning = false;
      if (restartButton) {
        restartButton.classList.remove("hidden");
      }
    } else {
      animationFrameId = requestAnimationFrame(animate);
    }
  }
};

const handleCanvasClick = (e) => {
  if (!simulationRunning || !canvas) return;
  if (insects.length >= MAX_INSECTS) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;
  const worldX = canvasX / scaleFactor;
  const worldY = canvasY / scaleFactor;
  insects.push(new Insect(worldX, worldY));
};

const handleAddFoodClick = () => {
  if (!simulationRunning || !canvas) return;
  if (insects.length >= MAX_INSECTS) {
    return;
  }
  const x = Math.random() * (WORLD_WIDTH - CANVAS_PADDING * 2) + CANVAS_PADDING;
  const y = Math.random() * (WORLD_HEIGHT - CANVAS_PADDING * 2) + CANVAS_PADDING;
  insects.push(new Insect(x, y));
};

const handleRestartClick = () => {
  initializeSimulation();
};

const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeCanvas, 150);
};

const handleKeyDown = (e) => {
  if (e.key.toLowerCase() === "h") {
    showHealthBar = !showHealthBar;
  } else if (e.key.toLowerCase() === "u") {
    showHungerBar = !showHungerBar;
  }
};

window.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("simulationCanvas");
  restartButton = document.getElementById("restartButton");
  addFoodButton = document.getElementById("addFoodButton");
  simulationContainer = document.querySelector(".simulation-container");

  if (canvas) {
    ctx = canvas.getContext("2d");
  } else {
    console.error("Canvas not found!");
    return;
  }

  if (canvas) {
    canvas.addEventListener("click", handleCanvasClick);
  }
  if (restartButton) {
    restartButton.addEventListener("click", handleRestartClick);
  }
  if (addFoodButton) {
    addFoodButton.addEventListener("click", handleAddFoodClick);
  }
  window.addEventListener("resize", handleResize);
  window.addEventListener("keydown", handleKeyDown);

  resizeCanvas();
  initializeSimulation();
});

const cleanup = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  window.removeEventListener("resize", handleResize);
  canvas.removeEventListener("click", handleCanvasClick);
  restartButton.removeEventListener("click", handleRestartClick);
  addFoodButton.removeEventListener("click", handleAddFoodClick);
  document.removeEventListener("keydown", handleKeyDown);
};

window.addEventListener("beforeunload", cleanup);
