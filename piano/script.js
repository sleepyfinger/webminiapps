class PianoStudy {
  constructor() {
    this.notes = [];
    this.keyMap = new Map();
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.initPiano();
    this.setupEventListeners();
    this.isPaused = false;
    this.gameLoopRequestId = null;
    this.isSoundOn = false;
    this.setupControlPanel();
    this.keyHeight = 200;
    this.animationStartOffset = 50;
    this.startDelay = 3000;
    this.playbackSpeed = parseFloat(
      localStorage.getItem("playbackSpeed") || "0.5"
    );
    this.updateSpeedSelect();
    this.soundType = localStorage.getItem("soundType") || "triangle";
    this.updateSoundTypeSelect();
    this.pianoWave = null;
    this.createPianoWave();
    this.totalNotes = 0;
    this.processedNotes = 0;
    this.noteSpeed = 2000;
    this.loadMidiFile("river_flows_in_you.mid");
  }

  async loadMidiFile(url) {
    const response = await fetch(url);
    const midiData = await response.arrayBuffer();
    const midi = new Midi(midiData);
    this.totalNotes = midi.tracks[0].notes.length;
    midi.tracks[0].notes.forEach((note) => {
      this.scheduleNote(
        note.midi,
        (note.time * 1000 + this.startDelay) / this.playbackSpeed,
        note.duration * 1000
      );
    });
    this.updateProgressBar();
    this.startGameLoop();
  }

  initPiano() {
    const gameArea = document.getElementById("gameArea");
    let whiteKeyIndex = 0;
    const whiteKeys = [];
    for (let midi = 21; midi <= 108; midi++) {
      const isBlack = [1, 3, 6, 8, 10].includes(midi % 12);
      const key = document.createElement("div");
      key.className = `key ${isBlack ? "black" : ""}`;
      if (!isBlack) {
        whiteKeys.push(key);
        whiteKeyIndex++;
      }
      key.dataset.midi = midi;
      gameArea.appendChild(key);
      this.keyMap.set(midi, key);
    }
    const whiteKeyWidth = 100 / whiteKeys.length;
    whiteKeys.forEach((key, index) => {
      key.style.width = `${whiteKeyWidth}%`;
      key.style.left = `${index * whiteKeyWidth}%`;
    });
    const blackKeys = document.querySelectorAll(".black");
    blackKeys.forEach((key) => {
      const midi = parseInt(key.dataset.midi);
      const whiteKeyIndex = this.getWhiteKeyIndex(midi);
      const blackKeyWidth = whiteKeyWidth * 0.6;
      const blackKeyLeft =
        whiteKeyIndex * whiteKeyWidth - 1 + (whiteKeyWidth - blackKeyWidth) / 2;
      key.style.width = `${blackKeyWidth}%`;
      key.style.left = `${blackKeyLeft}%`;
    });
  }

  getWhiteKeyIndex(midi) {
    let whiteKeyIndex = 0;
    for (let i = 21; i < midi; i++) {
      if (![1, 3, 6, 8, 10].includes(i % 12)) {
        whiteKeyIndex++;
      }
    }
    return whiteKeyIndex;
  }

  setupEventListeners() {
    document.querySelectorAll(".key").forEach((key) => {
      key.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.handleKeyPress(parseInt(key.dataset.midi));
      });
      key.addEventListener("mouseup", () =>
        this.handleKeyRelease(parseInt(key.dataset.midi))
      );
      key.addEventListener("mouseleave", () =>
        this.handleKeyRelease(parseInt(key.dataset.midi))
      );
      key.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.handleKeyPress(parseInt(key.dataset.midi));
      });
      key.addEventListener("touchend", (e) => {
        e.preventDefault();
        this.handleKeyRelease(parseInt(key.dataset.midi));
      });
    });
    document.addEventListener("keydown", (e) => {
      const keyMap = this.getKeyboardMapping();
      if (keyMap[e.key.toLowerCase()])
        this.handleKeyPress(keyMap[e.key.toLowerCase()]);
    });
    document.addEventListener("keyup", (e) => {
      const keyMap = this.getKeyboardMapping();
      if (keyMap[e.key.toLowerCase()])
        this.handleKeyRelease(keyMap[e.key.toLowerCase()]);
    });
  }

  getKeyboardMapping() {
    return {
      a: 60,
      w: 61,
      s: 62,
      e: 63,
      d: 64,
      f: 65,
      t: 66,
      g: 67,
      y: 68,
      h: 69,
      u: 70,
      j: 71,
      k: 72,
      o: 73,
      l: 74,
      p: 75,
      ";": 76,
      "'": 77,
    };
  }

  handleKeyPress(midi) {
    const keyElement = this.keyMap.get(midi);
    if (!keyElement.classList.contains("active")) {
      this.playSound(midi);
      keyElement.classList.add("active");
    }
  }

  handleKeyRelease(midi) {
    const keyElement = this.keyMap.get(midi);
    keyElement.classList.remove("active");
    this.stopSound(midi);
  }

  playSound(midi) {
    if (!this.isSoundOn) return;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    if (this.soundType === "piano") {
      oscillator.setPeriodicWave(this.pianoWave);
    } else {
      oscillator.type = this.soundType;
    }
    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 1.5
    );
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 1.5);
  }

  stopSound(midi) {}

  scheduleNote(midi, startTime, duration) {
    const noteElement = document.createElement("div");
    noteElement.className = "note";
    const isBlack = [1, 3, 6, 8, 10].includes(midi % 12);
    if (isBlack) noteElement.classList.add("black-note");
    const keyElement = this.keyMap.get(midi);
    const keyRect = keyElement.getBoundingClientRect();
    const gameAreaRect = document
      .getElementById("gameArea")
      .getBoundingClientRect();
    const relativeLeft = keyRect.left - gameAreaRect.left;
    noteElement.style.left = `${relativeLeft}px`;
    noteElement.style.width = `${keyRect.width}px`;
    noteElement.dataset.midi = midi;
    noteElement.dataset.processed = "false";
    noteElement.style.opacity = "0";

    const totalDistance =
      gameAreaRect.height - this.keyHeight + this.animationStartOffset;
    const animation = noteElement.animate(
      [
        { top: `-${this.animationStartOffset}px`, opacity: 0 },
        { top: `-${this.animationStartOffset + 50}px`, opacity: 1 },
        { top: `${totalDistance}px`, opacity: 1 },
      ],
      {
        duration: this.noteSpeed / this.playbackSpeed,
        delay: startTime - this.noteSpeed / this.playbackSpeed,
        easing: "linear",
        fill: "forwards",
      }
    );
    animation.onfinish = () => {
      if (noteElement.dataset.processed === "false") {
        this.playSound(midi);
        this.handleKeyPress(midi);
        setTimeout(() => this.handleKeyRelease(midi), duration);
        noteElement.dataset.processed = "true";
        this.processedNotes++;
        this.updateProgressBar();
      }
      noteElement.remove();
    };
    noteElement.animation = animation;
    document.getElementById("gameArea").appendChild(noteElement);
  }

  startGameLoop() {
    const gameLoop = () => {
      if (this.isPaused) return;

      const notes = document.querySelectorAll(".note");
      notes.forEach((note) => {
        const rect = note.getBoundingClientRect();
        const gameAreaRect = document
          .getElementById("gameArea")
          .getBoundingClientRect();
        if (
          rect.top > gameAreaRect.height - this.keyHeight - 20 &&
          note.dataset.processed === "false"
        ) {
          const midi = parseInt(note.dataset.midi);
          note.dataset.processed = "true";
          this.playSound(midi);
          this.handleKeyPress(midi);
          setTimeout(() => this.handleKeyRelease(midi), 300);
          this.processedNotes++;
          this.updateProgressBar();
          note.remove();
        }
      });
      this.gameLoopRequestId = requestAnimationFrame(gameLoop);
    };
    setTimeout(() => {
      this.gameLoopRequestId = requestAnimationFrame(gameLoop);
    }, (this.noteSpeed + this.startDelay) / this.playbackSpeed);
  }

  pauseGame() {
    this.isPaused = true;
    cancelAnimationFrame(this.gameLoopRequestId);
    document
      .querySelectorAll(".note")
      .forEach((note) => note.animation.pause());
  }

  resumeGame() {
    this.isPaused = false;
    this.startGameLoop();
    document.querySelectorAll(".note").forEach((note) => note.animation.play());
  }

  toggleSound() {
    this.isSoundOn = !this.isSoundOn;
    const soundButton = document.getElementById("soundButton");
    soundButton.textContent = this.isSoundOn ? "🔊" : "🔇";
  }

  changePlaybackSpeed(speed) {
    this.playbackSpeed = parseFloat(speed);
    localStorage.setItem("playbackSpeed", this.playbackSpeed);
    this.updateSpeedSelect();
    this.adjustNoteSpeed();
  }

  adjustNoteSpeed() {
    document.querySelectorAll(".note").forEach((note) => {
      const animation = note.animation;
      const currentTime = animation.currentTime;
      const newDuration = this.noteSpeed / this.playbackSpeed;
      const newDelay =
        animation.effect.getTiming().delay -
        (animation.effect.getTiming().duration - newDuration);
      animation.effect.updateTiming({ duration: newDuration, delay: newDelay });
      animation.currentTime = currentTime;
    });
  }

  updateSpeedSelect() {
    const speedSelect = document.getElementById("speedSelect");
    speedSelect.value = this.playbackSpeed;
  }

  changeSoundType(type) {
    this.soundType = type;
    localStorage.setItem("soundType", type);
    this.updateSoundTypeSelect();
  }

  updateSoundTypeSelect() {
    const soundTypeSelect = document.getElementById("soundTypeSelect");
    soundTypeSelect.value = this.soundType;
  }

  setupControlPanel() {
    const pauseResumeButton = document.getElementById("pauseResumeButton");
    const soundButton = document.getElementById("soundButton");
    const speedSelect = document.getElementById("speedSelect");
    const soundTypeSelect = document.getElementById("soundTypeSelect");

    soundTypeSelect.addEventListener("change", (event) =>
      this.changeSoundType(event.target.value)
    );
    soundButton.addEventListener("click", () => this.toggleSound());
    speedSelect.addEventListener("change", (event) =>
      this.changePlaybackSpeed(event.target.value)
    );

    pauseResumeButton.addEventListener("click", () => {
      if (this.isPaused) {
        this.resumeGame();
      } else {
        this.pauseGame();
      }

      pauseResumeButton.textContent = this.isPaused ? "⏯️" : "⏸️";

      console.log(isPaused ? "Paused" : "Resumed");
    });
  }

  createPianoWave() {
    const real = new Float32Array([
      0, 0.8, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001,
    ]);
    const imag = new Float32Array(real.length);
    this.pianoWave = this.audioContext.createPeriodicWave(real, imag);
  }

  updateProgressBar() {
    const progressBar = document.getElementById("progressBar");
    const progress = (this.processedNotes / this.totalNotes) * 100;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
  }
}

const game = new PianoStudy();
