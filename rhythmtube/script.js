function dataLoaded(data) {
  displaySongList(data);
}

function displaySongList(songs) {
  const songListContainer = document.getElementById("songListContainer");
  songListContainer.innerHTML = "";

  songs.forEach((song) => {
    if (!song.title || !song.thumbnail || !song.description) {
      getYoutubeData(song.url).then((data) => {
        song.title = data.title;
        song.thumbnail = data.thumbnail;
        song.description = data.description;
        createSongItem(song, songListContainer);
      });
    } else {
      createSongItem(song, songListContainer);
    }
  });
}
function createSongItem(song, songListContainer) {
  const songItem = document.createElement("div");
  songItem.classList.add("songItem");

  const thumbnail = document.createElement("img");
  thumbnail.src = song.thumbnail;
  thumbnail.classList.add("songThumbnail");
  thumbnail.alt = song.title;

  const songDetails = document.createElement("div");
  songDetails.classList.add("songDetails");

  const title = document.createElement("div");
  title.classList.add("songTitle");
  title.textContent = song.title;

  const description = document.createElement("div");
  description.classList.add("songDescription");
  description.textContent = song.description || "No description available";

  songDetails.appendChild(title);
  songDetails.appendChild(description);

  songItem.appendChild(thumbnail);
  songItem.appendChild(songDetails);

  songItem.addEventListener("click", () => {
    console.log("Selected song:", song.title);
    const videoUrlInput = document.getElementById("videoUrl");
    videoUrlInput.value = song.url;
  });

  songListContainer.appendChild(songItem);
}

async function getYoutubeData(url) {
  const videoId = getVideoIdFromUrl(url);
  if (!videoId) {
    console.error("Invalid YouTube URL:", url);
    return null;
  }

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${url}&format=json`
    );
    const data = await response.json();
    return {
      title: data.title,
      thumbnail: data.thumbnail_url,
      description: data.author_name,
    };
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    return {
      title: "Error fetching title",
      thumbnail: "",
      description: "Error fetching description",
    };
  }
}

let tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;
let videoDuration = 0;
let originalVolume = 100;

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

function onPlayerReady() {
  originalVolume = player.getVolume();
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    videoDuration = player.getDuration();
    if (game.isPaused) {
      game.resume();
    } else {
      game.reset();
      game.start();
    }
  } else if (event.data === YT.PlayerState.PAUSED) {
    game.pause();
  } else if (event.data === YT.PlayerState.ENDED) {
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
    this.pausedTime = 0;
    this.isPaused = false;
  }

  start() {
    this.startTime = player.getCurrentTime();
    this.isPaused = false;
    this.pausedTime = 0;
  }

  pause() {
    if (this.startTime !== 0 && !this.isPaused) {
      this.pausedTime = player.getCurrentTime();
      this.isPaused = true;
    }
  }

  resume() {
    if (this.startTime !== 0 && this.isPaused) {
      this.startTime += player.getCurrentTime() - this.pausedTime;
      this.isPaused = false;
    }
  }

  update() {
    if (this.startTime !== 0 && !this.isPaused) {
      this.songPosition = player.getCurrentTime() - this.startTime;
    }
  }
}

class Note {
  constructor(lane, time, speed) {
    this.lane = lane;
    this.time = time;
    this.speed = speed;
    this.isHit = false;
    this.element = null;
    this.targetY = 250;
    this.fillColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    this.hitTime = null;
    this.noteWidth = 100;
    this.noteHeight = 20;
    this.startNoteY = -this.noteHeight;
    this.x = this.getLaneX(lane);
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

  update(conductor, hitLineY, gameHeight) {
    if (!this.isHit && !conductor.isPaused) {
      const timeToReachTarget = this.targetY / this.speed;
      const timeElapsed = conductor.songPosition - this.time;
      const visibleTimeElapsed = timeElapsed;
      if (visibleTimeElapsed < -timeToReachTarget) return;

      this.y = this.startNoteY + visibleTimeElapsed * this.speed;
      this.element.style.top = this.y + "px";

      if (this.y > gameHeight) {
        this.remove();
        return;
      }
    }
    if (this.y > gameHeight || this.isHit) {
      this.remove();
    }
  }

  checkHit(hitY) {
    const perfectWindow = 10;
    const goodWindow = 25;
    const hitWindow = 50;

    const centerY = this.y + this.noteHeight / 2;
    const distance = Math.abs(centerY - hitY);
    let result = "Miss";

    if (distance <= perfectWindow) {
      result = "Perfect";
      this.isHit = true;
    } else if (distance <= goodWindow) {
      result = "Good";
      this.isHit = true;
    } else if (distance <= hitWindow) {
      result = "Hit";
      this.isHit = true;
    }
    return result;
  }

  remove() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
  }
}

class Game {
  constructor() {
    this.conductor = new Conductor(120);
    this.notes = [];
    this.isPlaying = false;
    this.noteGenerateInterval = 0.35;
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
    this.volumeTransitionDuration = 100; // 볼륨 전환 시간 (0.1초)
  }

  start() {
    this.isPlaying = true;
    this.isPaused = false;
    this.conductor.start();
    this.lastNoteGenerateTime = player.getCurrentTime();
    this.createHitLine();
    this.createLaneLines();
    this.createKeyUI();
    this.gameLoop();
  }

  pause() {
    this.isPaused = true;
    this.conductor.pause();
  }

  resume() {
    this.isPaused = false;
    this.conductor.resume();
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
    this.adjustVolume(originalVolume, this.volumeTransitionDuration);
    if (this.muteTimeout) {
      clearTimeout(this.muteTimeout);
    }
  }

  getRandomLane() {
    return Math.floor(Math.random() * this.lanes.length);
  }

  generateNotes() {
    if (this.conductor.isPaused || this.isGenerating) return;
    this.isGenerating = true;

    const now = player.getCurrentTime();
    const generateTime = now + this.noteAppearOffset;

    if (
      now < videoDuration * 0.95 &&
      now - this.lastNoteGenerateTime >= this.noteGenerateInterval
    ) {
      this.lastNoteGenerateTime = now;
      if (generateTime < videoDuration) {
        const lane = this.getRandomLane();
        this.notes.push(new Note(lane, generateTime, this.noteSpeed));
      }
    }
    this.isGenerating = false;
  }

  gameLoop() {
    if (this.isPlaying) {
      this.conductor.update();
      this.generateNotes();
      this.notes.forEach((note) =>
        note.update(this.conductor, this.hitLineY, this.gameHeight)
      );
      if (!this.conductor.isPaused) {
        requestAnimationFrame(() => this.gameLoop());
      }
    }
  }

  adjustVolume(volume, duration) {
    player.setPlaybackRate(1);
    player.setVolume(volume);
    player.setPlaybackRate(1);
  }

  hitNote(lane) {
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
          this.adjustVolume(originalVolume, this.volumeTransitionDuration);
        }
        this.showKeyEffect(lane, hitResult);
      } else {
        this.adjustVolume(originalVolume * 0.1, this.volumeTransitionDuration);
        if (this.muteTimeout) {
          clearTimeout(this.muteTimeout);
        }

        this.muteTimeout = setTimeout(() => {
          this.adjustVolume(originalVolume, this.volumeTransitionDuration);
          this.muteTimeout = null;
        }, 500);

        this.combo = 0;
        this.showKeyEffect(lane, hitResult);
        this.updateUI();
      }
    } else {
      this.combo = 0;
      this.showKeyEffect(lane, hitResult);
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
