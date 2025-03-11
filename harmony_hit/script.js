let tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";

let firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;
let videoDuration = 0;

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "360",
    width: "640",
    videoId: "",
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
    playerVars: {
      controls: 0,
      disablekb: 1,
    },
  });
}

function onPlayerReady(event) {
  console.log("Player is ready.");
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    console.log("Player is playing.");
    videoDuration = player.getDuration();
    game.start();
  } else if (event.data === YT.PlayerState.ENDED) {
    console.log("Player ended.");
    game.reset();
  }
}

const videoUrlInput = document.getElementById("videoUrl");
const playButton = document.getElementById("playButton");

playButton.addEventListener("click", () => {
  const videoUrl = videoUrlInput.value;
  const videoId = getVideoIdFromUrl(videoUrl);
  if (videoId) {
    loadVideoById(videoId);
  } else {
    alert("유효한 유튜브 URL을 입력해주세요.");
  }
});

function getVideoIdFromUrl(url) {
  const regex =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regex);
  return match && match[7].length === 11 ? match[7] : false;
}

function loadVideoById(videoId) {
  if (player) {
    player.loadVideoById(videoId);
  }
}

class Conductor {
  constructor(bpm) {
    this.bpm = bpm;
    this.crotchet = 60 / bpm;
    this.songPosition = 0;
    this.startTime = 0;
  }

  start() {
    this.startTime = player.getCurrentTime();
  }

  update() {
    if (this.startTime !== 0) {
      this.songPosition = player.getCurrentTime() - this.startTime;
    }
  }
}

class Note {
  constructor(lane, time, speed) {
    this.lane = lane;
    this.x = this.getLaneX(lane);
    this.time = time;
    this.speed = speed;
    this.isHit = false;
    this.element = null;
    this.targetY = 250;
    this.fillColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    this.hitTime = null;
    this.noteWidth = 100;
    this.noteHeight = 50;
    this.startNoteY = -this.noteHeight;
    this.y = this.startNoteY;
    this.createNote();
  }

  getLaneX(lane) {
    return lane * this.noteWidth;
  }

  createNote() {
    this.element = document.createElement("div");
    this.element.classList.add("note");
    this.element.style.left = this.x + "px";
    this.element.style.top = this.y + "px";
    this.element.style.backgroundColor = this.fillColor;
    this.element.style.width = `${this.noteWidth}px`;
    this.element.style.height = `${this.noteHeight}px`;
    this.element.style.borderRadius = "5px";
    document.getElementById("gameArea").appendChild(this.element);
  }

  update(conductor) {
    if (!this.isHit) {
      const timeToReachTarget = this.targetY / this.speed;
      const timeElapsed = conductor.songPosition - this.time;
      const visibleTimeElapsed = timeElapsed;
      if (visibleTimeElapsed < -timeToReachTarget) {
        return;
      }

      this.y = this.startNoteY + visibleTimeElapsed * this.speed;
      this.element.style.top = this.y + "px";
      if (visibleTimeElapsed >= timeToReachTarget) {
        this.isHit = true;
        this.hitTime = conductor.songPosition;
        this.checkHit(conductor.songPosition);
        this.element.classList.add("end");
        setTimeout(() => {
          this.remove();
        }, 500);
      }
    }
  }

  checkHit(songPosition) {
    const hitWindow = 0.2;
    const perfectWindow = 0.05;
    const goodWindow = 0.1;
    const timeDiff = Math.abs(this.hitTime - this.time);
    let result = "Miss";
    if (timeDiff <= perfectWindow) {
      console.log("Perfect!");
      result = "Perfect";
    } else if (timeDiff <= goodWindow) {
      console.log("Good!");
      result = "Good";
    } else if (timeDiff <= hitWindow) {
      console.log("Hit!");
      result = "Hit";
    } else {
      console.log("Miss!");
    }
    return result;
  }

  remove() {
    this.element.remove();
  }
}

class Game {
  constructor() {
    this.conductor = new Conductor(120);
    this.notes = [];
    this.isPlaying = false;
    this.noteGenerateInterval = 0.5;
    this.lastNoteGenerateTime = 0;
    this.noteAppearOffset = 2;
    this.score = 0;
    this.combo = 0;
    this.gameWidth = 400;
    this.gameHeight = 300;
    this.lanes = [0, 1, 2, 3];
    this.keyMap = ["d", "f", "j", "k"];
    this.laneColors = ["red", "blue", "green", "yellow"];
    this.scoreElement = document.getElementById("score");
    this.comboElement = document.getElementById("combo");
    this.gameArea = document.getElementById("gameArea");
    this.hitLineY = 250;
    this.keyElements = [];
    this.laneAreas = [];
    this.noteSpeed = 250;
    this.notePatterns = [
      [0],
      [1],
      [2],
      [3],
      [0, 1],
      [1, 2],
      [2, 3],
      [0, 2],
      [1, 3],
      [0, 1, 2],
      [1, 2, 3],
      [0, 1, 2, 3],
    ];
    this.patternIndex = 0;
    this.noteQueue = [];
    this.isGenerating = false;
  }

  start() {
    this.reset();
    this.isPlaying = true;
    this.conductor.start();
    this.gameLoop();
    this.lastNoteGenerateTime = player.getCurrentTime();
    this.createHitLine();
    this.createLaneLines();
    this.createKeyUI();
    this.initNoteQueue();
  }

  createHitLine() {
    const hitLine = document.createElement("div");
    hitLine.classList.add("hitLine");
    hitLine.style.top = `${this.hitLineY}px`;
    document.getElementById("gameArea").appendChild(hitLine);
  }

  createLaneLines() {
    for (let i = 1; i < this.lanes.length; i++) {
      const laneLine = document.createElement("div");
      laneLine.classList.add("laneLine");
      laneLine.style.left = `${i * 100}px`;
      document.getElementById("gameArea").appendChild(laneLine);
    }
  }

  createKeyUI() {
    const keyArea = document.createElement("div");
    keyArea.classList.add("keyArea");
    for (let i = 0; i < this.keyMap.length; i++) {
      const laneArea = document.createElement("div");
      laneArea.classList.add("laneArea");
      const keyElement = document.createElement("div");
      keyElement.textContent = this.keyMap[i].toUpperCase();
      keyElement.classList.add("keyElement");
      laneArea.appendChild(keyElement);
      keyArea.appendChild(laneArea);
      this.keyElements.push({ keyElement, laneArea });
    }
    this.gameArea.appendChild(keyArea);
  }

  reset() {
    this.isPlaying = false;
    this.conductor.startTime = 0;
    this.notes.forEach((note) => note.remove());
    this.notes = [];
    document.getElementById("gameArea").innerHTML = "";
    this.lastNoteGenerateTime = 0;
    this.score = 0;
    this.combo = 0;
    this.keyElements = [];
    this.laneAreas = [];
    this.patternIndex = 0;
    this.noteQueue = [];
    this.isGenerating = false;
    this.updateUI();
  }

  initNoteQueue() {
    for (let i = 0; i < 10; i++) {
      this.enqueueNotePattern();
    }
  }

  enqueueNotePattern() {
    const pattern =
      this.notePatterns[Math.floor(Math.random() * this.notePatterns.length)];
    this.noteQueue.push(pattern);
  }

  dequeueNotePattern() {
    return this.noteQueue.shift();
  }

  generateNotes() {
    if (this.isGenerating) return;
    this.isGenerating = true;
    const now = player.getCurrentTime();
    const generateTime = now + this.noteAppearOffset;
    if (now - this.lastNoteGenerateTime >= this.noteGenerateInterval) {
      this.lastNoteGenerateTime = now;
      const pattern = this.dequeueNotePattern();
      if (pattern) {
        if (generateTime < videoDuration) {
          pattern.forEach((lane) => {
            this.notes.push(new Note(lane, generateTime, this.noteSpeed));
          });
        }
        this.enqueueNotePattern();
      }
      this.isGenerating = false;
    }
  }

  gameLoop() {
    if (this.isPlaying) {
      this.conductor.update();
      this.generateNotes();
      this.notes.forEach((note) => note.update(this.conductor));
      requestAnimationFrame(() => this.gameLoop());
    }
  }

  hitNote(lane) {
    const hitWindow = 0.2;
    const now = this.conductor.songPosition;
    const closestNote = this.notes
      .filter(
        (note) =>
          !note.isHit &&
          note.y >= this.hitLineY - 20 &&
          note.y <= this.hitLineY + 20 &&
          note.lane === lane
      )
      .reduce((prev, curr) => {
        const prevDiff = Math.abs(now - curr.time);
        const currDiff = Math.abs(now - curr.time);
        return prevDiff < currDiff ? prev : curr;
      }, null);
    if (closestNote && Math.abs(now - closestNote.time) <= hitWindow) {
      closestNote.isHit = true;
      closestNote.hitTime = now;
      closestNote.element.classList.add("hit");
      const hitResult = closestNote.checkHit(now);
      this.updateScore(hitResult);
      this.showKeyEffect(lane);
      setTimeout(() => {
        closestNote.remove();
      }, 500);
    } else {
      this.combo = 0;
      this.showKeyEffect(lane, true);
    }
    this.updateUI();
  }

  updateScore(hitResult) {
    if (hitResult === "Perfect") {
      this.score += 100;
      this.combo += 1;
    } else if (hitResult === "Good") {
      this.score += 50;
      this.combo += 1;
    } else if (hitResult === "Hit") {
      this.score += 25;
      this.combo += 1;
    } else {
      this.combo = 0;
    }
  }

  updateUI() {
    this.scoreElement.textContent = `Score : ${this.score}`;
    this.comboElement.textContent = `Combo : ${this.combo}`;
  }

  showKeyEffect(lane, isMiss = false) {
    if (lane < 0 || lane >= this.keyElements.length) {
      console.error(`Invalid lane index: ${lane}`);
      return;
    }

    const { keyElement, laneArea } = this.keyElements[lane];
    keyElement.style.transition = "background-color 0.1s linear";
    if (isMiss) {
      keyElement.style.backgroundColor = `red`;
    } else {
      keyElement.style.backgroundColor = `green`;
    }
    setTimeout(() => {
      keyElement.style.backgroundColor = "transparent";
    }, 100);
  }

  getLaneBackgroundColor(lane) {
    return this.laneColors[lane];
  }
}

const game = new Game();

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "d":
      game.hitNote(0);
      break;
    case "f":
      game.hitNote(1);
      break;
    case "j":
      game.hitNote(2);
      break;
    case "k":
      game.hitNote(3);
      break;
  }
});
