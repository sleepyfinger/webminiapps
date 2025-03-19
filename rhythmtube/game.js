import Conductor from "./conductor.js";
import Note from "./note.js";

class Game {
  constructor(soundManager, player) {
    this.conductor = new Conductor(120);
    this.notes = [];
    this.isPlaying = false;
    this.noteGenerateInterval = 0.38;
    this.lastNoteGenerateTime = 0;
    this.noteAppearOffset = 2;
    this.score = 0;
    this.combo = 0;
    this.gameWidth = 400;
    this.gameHeight = 300;
    this.lanes = [0, 1, 2, 3];
    this.keyMap = ["d", "f", "j", "k"];
    this.scoreElement = document.getElementById("score");
    this.comboElement = document.getElementById("combo");
    this.gameArea = document.getElementById("gameArea");
    this.hitLineY = 250;
    this.keyElements = [];
    this.noteSpeed = 250;
    this.isGenerating = false;
    this.isPaused = false;
    this.muteTimeout = null;
    this.volumeTransitionDuration = 100;
    this.soundManager = soundManager;
    this.player = player;
    this.laneSoundMap = { 0: "d", 1: "f", 2: "j", 3: "k" };
  }

  start() {
    this.isPlaying = true;
    this.isPaused = false;
    this.conductor.start(this.player);
    this.lastNoteGenerateTime = this.player.getCurrentTime();
    this.createHitLine();
    this.createLaneLines();
    this.createKeyUI();
    this.gameLoop();
  }

  pause() {
    this.isPaused = true;
    this.conductor.pause(this.player);
  }

  resume() {
    this.isPaused = false;
    this.conductor.resume(this.player);
    this.gameLoop();
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
      const keyElement = document.createElement("div");
      keyElement.textContent = this.keyMap[i].toUpperCase();
      keyElement.classList.add("keyElement");
      keyArea.appendChild(keyElement);
      this.keyElements.push({ keyElement });
    }

    this.gameArea.appendChild(keyArea);
  }

  reset() {
    this.isPlaying = false;
    this.isPaused = false;
    this.conductor.startTime = 0;
    this.notes.forEach((note) => note.remove());
    this.notes = [];
    this.gameArea.innerHTML = "";
    this.lastNoteGenerateTime = 0;
    this.score = 0;
    this.combo = 0;
    this.keyElements = [];
    this.isGenerating = false;
    this.updateUI();
    if (this.player && this.player.originalVolume !== undefined) {
      this.adjustVolume(
        this.player.originalVolume,
        this.volumeTransitionDuration
      );
    }
    if (this.muteTimeout) {
      clearTimeout(this.muteTimeout);
      this.muteTimeout = null;
    }
  }

  getRandomLane() {
    return Math.floor(Math.random() * this.lanes.length);
  }

  generateNotes() {
    if (this.conductor.isPaused || this.isGenerating) return;
    this.isGenerating = true;
    const now = this.player.getCurrentTime();
    const generateTime = now + this.noteAppearOffset;
    if (
      now < this.player.getDuration() * 0.9 &&
      now - this.lastNoteGenerateTime >= this.noteGenerateInterval
    ) {
      this.lastNoteGenerateTime = now;
      if (generateTime < this.player.getDuration()) {
        const lane = this.getRandomLane();
        this.notes.push(new Note(lane, generateTime, this.noteSpeed));
      }
    }
    this.isGenerating = false;
  }

  gameLoop() {
    if (this.isPlaying && !this.isPaused) {
      this.conductor.update(this.player);
      this.generateNotes();
      this.notes.forEach((note) =>
        note.update(this.conductor, this.hitLineY, this.gameHeight)
      );
      this.notes.forEach((note) => {
        if (!note.isHit && note.y > this.gameHeight) {
          this.updateScore("Miss");
          note.isHit = true;
        }
      });
      requestAnimationFrame(() => this.gameLoop());
    }
  }

  adjustVolume(volume, duration) {
    this.player.setVolume(volume);
    this.player.setPlaybackRate(1);
  }

  hitNote(lane) {
    this.soundManager.playSound(this.laneSoundMap[lane]);
    const now = this.conductor.songPosition;
    const closestNote = this.notes
      .filter((note) => !note.isHit && note.lane === lane)
      .reduce((prev, curr) => {
        const prevDiff = Math.abs(prev.y + prev.noteHeight / 2 - this.hitLineY);
        const currDiff = Math.abs(curr.y + curr.noteHeight / 2 - this.hitLineY);
        return prevDiff < currDiff ? prev : curr;
      }, this.notes.find((note) => !note.isHit && note.lane === lane) || null);
    if (closestNote) {
      const hitResult = closestNote.checkHit(this.hitLineY);
      if (hitResult !== "Miss") {
        closestNote.isHit = true;
        closestNote.hitTime = now;
        closestNote.element.classList.add("hit");
        this.updateScore(hitResult);
        if (this.muteTimeout) {
          clearTimeout(this.muteTimeout);
          this.muteTimeout = null;
        }
        this.adjustVolume(
          this.player.originalVolume * this.player.bgmVolume,
          this.volumeTransitionDuration
        );
        this.showKeyEffect(lane, hitResult);
      } else {
        if (!this.muteTimeout) {
          this.adjustVolume(
            this.player.originalVolume * this.player.bgmVolume * 0.1,
            this.volumeTransitionDuration
          );
          this.muteTimeout = setTimeout(() => {
            this.adjustVolume(
              this.player.originalVolume * this.player.bgmVolume,
              this.volumeTransitionDuration
            );
            this.muteTimeout = null;
          }, 500);
        }
        this.updateScore("Miss");
        this.combo = 0;
        this.showKeyEffect(lane, hitResult);
        this.updateUI();
      }
    } else {
      this.combo = 0;
      this.showKeyEffect(lane, "Miss");
      this.updateUI();
    }
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

    this.updateUI();
    this.showHitResultEffect(hitResult);
  }

  updateUI() {
    this.scoreElement.textContent = `Score : ${this.score}`;
    this.comboElement.textContent = `Combo : ${this.combo}`;
  }

  showKeyEffect(lane, hitResult) {
    if (lane < 0 || lane >= this.keyElements.length) return;
    const { keyElement } = this.keyElements[lane];
    keyElement.style.transition = "background-color 0.1s linear";
    if (hitResult === "Perfect") {
      keyElement.style.backgroundColor = "green";
    } else if (hitResult === "Good") {
      keyElement.style.backgroundColor = "blue";
    } else if (hitResult === "Hit") {
      keyElement.style.backgroundColor = "yellow";
    } else {
      keyElement.style.backgroundColor = "red";
    }

    setTimeout(() => {
      keyElement.style.backgroundColor = "transparent";
    }, 100);
  }

  showHitResultEffect(hitResult) {
    const resultElement = document.createElement("div");
    resultElement.textContent = hitResult;
    resultElement.classList.add("hitResultEffect");
    resultElement.style.position = "absolute";
    resultElement.style.top = "20%";
    resultElement.style.left = "50%";
    resultElement.style.transform = "translate(-50%, -50%)";
    this.gameArea.appendChild(resultElement);
    resultElement.animate(
      [
        { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
        { opacity: 0, transform: "translate(-50%, -80%) scale(1.5)" },
      ],
      {
        duration: 500,
        easing: "ease-out",
      }
    );
    setTimeout(() => {
      resultElement.remove();
    }, 500);
  }
}

export default Game;
