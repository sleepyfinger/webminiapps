const isDebugMode = true;
if (!isDebugMode) {
  window.console = {
    log: function () {},
    warn: function () {},
    error: function () {},
  };
}

import { YouTubePlayer, getVideoIdFromUrl } from "./youtubePlayer.js";
import SoundManager from "./soundManager.js";
import Game from "./game.js";
import { songData } from "./data.js";

let player;
let currentSongIndex = 0;
const repeatModes = ["none", "one", "all", "random"];
let currentRepeatModeIndex = 3;
let game;
let soundManager;
let isPlayerReady = false;

window.onYouTubeIframeAPIReady = function () {
  console.log("onYouTubeIframeAPIReady called");
  if (typeof YT === "undefined" || typeof YT.Player === "undefined") {
    console.error("YouTube IFrame API is not loaded properly.");
    return;
  }
  player = new YouTubePlayer("player", onPlayerReady, onPlayerStateChange);
  player.onYouTubeIframeAPIReady();
};

function onPlayerReady(playerInstance) {
  console.log("onPlayerReady in script.js called");
  player = playerInstance;
  player.setPlaybackRate(1);
  updateRepeatButtonStyles();
  setInitialVolume();
  isPlayerReady = true;
  game = new Game(soundManager, player);
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    if (!game.isPlaying) {
      startGame();
    } else if (game.isPaused) {
      game.resume();
    }
    setInitialVolume();
  } else if (event.data === YT.PlayerState.PAUSED) {
    game.pause();
  } else if (event.data === YT.PlayerState.ENDED) {
    handleVideoEnded();
  }
}

// 사운드 매니저 초기화
soundManager = new SoundManager();
soundManager.loadSounds();

// 볼륨 초기화
function setInitialVolume() {
  if (!isPlayerReady) return;
  player.bgmVolume = parseFloat(bgmVolumeControl.value);
  soundManager.setSfxVolume(parseFloat(sfxVolumeControl.value));
  player.setVolume(player.originalVolume * player.bgmVolume);
}

// UI 요소 가져오기
const videoUrlInput = document.getElementById("videoUrl");
const playButton = document.getElementById("playButton");
const randButton = document.getElementById("randButton");
const repeatButton = document.getElementById("repeatButton");
const bgmVolumeControl = document.getElementById("bgmVolumeControl");
const sfxVolumeControl = document.getElementById("sfxVolumeControl");

// 이벤트 리스너 등록
playButton.addEventListener("click", playVideo);
randButton.addEventListener("click", loadNextVideo);
repeatButton.addEventListener("click", handleRepeatButtonClick);
bgmVolumeControl.addEventListener("input", handleBgmVolumeChange);
sfxVolumeControl.addEventListener("input", handleSfxVolumeChange);

// 비디오 재생
async function playVideo() {
  if (!isPlayerReady) {
    console.error("Player is not ready yet.");
    return;
  }
  resetGame();
  const videoUrl = videoUrlInput.value;
  const videoId = getVideoIdFromUrl(videoUrl);
  if (videoId) {
    await new Promise((resolve) => {
      player.loadVideoById(videoId, () => {
        const song = songData.find((s) => s.url === videoUrl);
        if (song) {
          scrollToSong(song, document.getElementById("songListContainer"));
        }
        resolve();
      });
    });
  } else {
    alert("유효한 유튜브 URL을 입력해주세요.");
  }
}

// 다음 비디오 로드
function loadNextVideo() {
  if (!isPlayerReady) return;
  if (songData.length === 0) {
    return;
  }

  if (repeatModes[currentRepeatModeIndex] === "random") {
    // 배열 섞기
    for (let i = songData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [songData[i], songData[j]] = [songData[j], songData[i]];
    }
    currentSongIndex = 0;
  } else {
    currentSongIndex = (currentSongIndex + 1) % songData.length;
  }

  videoUrlInput.value = songData[currentSongIndex].url;
  playVideo();
}

// 비디오 종료 처리
function handleVideoEnded() {
  if (!isPlayerReady) return;
  if (repeatModes[currentRepeatModeIndex] === "one") {
    playVideo();
  } else if (
    repeatModes[currentRepeatModeIndex] === "all" ||
    repeatModes[currentRepeatModeIndex] === "random"
  ) {
    loadNextVideo();
  } else {
    resetGame();
  }
}

// 반복 버튼 클릭 처리
function handleRepeatButtonClick() {
  if (!isPlayerReady) return;
  currentRepeatModeIndex = (currentRepeatModeIndex + 1) % repeatModes.length;
  updateRepeatButtonStyles();
}

// BGM 볼륨 변경 처리
function handleBgmVolumeChange() {
  if (!isPlayerReady) return;
  player.bgmVolume = parseFloat(bgmVolumeControl.value);
  player.setVolume(player.originalVolume * player.bgmVolume);
}

// SFX 볼륨 변경 처리
function handleSfxVolumeChange() {
  if (!isPlayerReady) return;
  soundManager.setSfxVolume(parseFloat(sfxVolumeControl.value));
}

// 반복 버튼 스타일 업데이트
function updateRepeatButtonStyles() {
  const repeatIcon = repeatButton.querySelector("i");
  repeatButton.classList.remove("active");
  repeatIcon.classList.remove(
    "fa-redo-alt",
    "fa-retweet",
    "fa-random",
    "fa-redo"
  );

  switch (repeatModes[currentRepeatModeIndex]) {
    case "one":
      repeatButton.classList.add("active");
      repeatIcon.classList.add("fa-redo-alt");
      break;
    case "all":
      repeatButton.classList.add("active");
      repeatIcon.classList.add("fa-retweet");
      break;
    case "random":
      repeatButton.classList.add("active");
      repeatIcon.classList.add("fa-random");
      break;
    default:
      repeatIcon.classList.add("fa-redo");
      break;
  }
}

// 키 입력 처리
document.addEventListener("keydown", (event) => {
  if (!isPlayerReady) return;
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

// YouTube IFrame API 로드
let tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 데이터 로드 및 표시
function dataLoaded(data) {
  displaySongList(data);
}

async function displaySongList(songs) {
  const songListContainer = document.getElementById("songListContainer");
  songListContainer.innerHTML = "";

  const songPromises = songs.map(async (song) => {
    const data = await getYoutubeData(song.url);
    return { ...song, ...data };
  });

  const songsWithData = await Promise.all(songPromises);
  songsWithData.forEach((song) => createSongItem(song, songListContainer));
}

function createSongItem(song, songListContainer) {
  const songItem = document.createElement("div");
  songItem.classList.add("songItem");
  songItem.dataset.url = song.url;

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
    videoUrlInput.value = song.url;
    playVideo();
  });

  songListContainer.appendChild(songItem);
}

function scrollToSong(song, songListContainer) {
  const targetItem = songListContainer.querySelector(
    `.songItem[data-url="${song.url}"]`
  );

  if (targetItem) {
    targetItem.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  } else {
    console.log("Song item not found:", song.url);
  }
}

async function getYoutubeData(url) {
  const videoId = getVideoIdFromUrl(url);
  if (!videoId) {
    console.error("Invalid YouTube URL:", url);
    return {
      title: "Invalid URL",
      thumbnail: "",
      description: "Invalid URL",
    };
  }

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      title: data.title,
      thumbnail: data.thumbnail_url,
      description: data.author_name,
    };
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    alert("유튜브 데이터를 가져오는 데 실패했습니다.");
    return {
      title: "Error fetching title",
      thumbnail: "",
      description: "Error fetching description",
    };
  }
}

if (typeof dataLoaded === "function") {
  dataLoaded(songData);
}

function resetGame() {
  game.reset();
}

function startGame() {
  game.start();
}
