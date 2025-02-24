import { topics, names } from "./data.js";

const DEFAULT_COUNTDOWN = 5;

const mainMenu = document.getElementById("mainMenu");
const topicList = document.getElementById("topicList");
const inputForm = document.getElementById("inputForm");
const nameDisplay = document.getElementById("nameDisplay");
const backButton = document.getElementById("backButton");
const title = document.getElementById("title");
const version = document.getElementById("version");
const themeStyle = document.getElementById("theme-style");
const themeToggleButton = document.getElementById("theme-toggle-button");
const nameInput = document.getElementById("nameInput");
const rotateButton = document.getElementById("rotateButton");
const fullScreenButton = document.getElementById("fullScreenButton");
const retryButton = document.getElementById("retryButton");
const preventScreenOffButton = document.getElementById(
  "preventScreenOffButton"
);

let currentTheme = "dark";
let isRotated = false;
let isFullScreen = false;
let currentTopic = "";
let lastSelectedName = "";
let wakeLock = null; // 화면 꺼짐 방지

preventScreenOffButton.addEventListener("click", async () => {
  if (!wakeLock) {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      preventScreenOffButton.classList.add("active");
      preventScreenOffButton.textContent = "💡"; // 활성화 상태 아이콘
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  } else {
    wakeLock.release();
    wakeLock = null;
    preventScreenOffButton.classList.remove("active");
    preventScreenOffButton.textContent = "🔆"; // 비활성화 상태 아이콘
  }
});

// 페이지 가시성 변경 시 WakeLock 재요청
document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    wakeLock = await navigator.wakeLock.request("screen");
  }
});

function setTheme(theme) {
  currentTheme = theme;
  themeStyle.setAttribute("href", `${currentTheme}-theme.css`);
  themeToggleButton.textContent = currentTheme === "light" ? "🌙" : "☀️";
}

function toggleRotation() {
  isRotated = !isRotated;
  document.body.classList.toggle("rotated", isRotated);
  if (isRotated) {
    document.body.style.width = "100vh";
    document.body.style.height = "100vw";
  } else {
    document.body.style.width = "";
    document.body.style.height = "";
  }
}

function showTopics() {
  hideAllSections();
  topicList.innerHTML = "";
  topics.forEach((topic) => {
    const button = document.createElement("button");
    button.textContent = topic;
    button.onclick = () => selectRandomName(topic);
    topicList.appendChild(button);
  });
  topicList.classList.add("active");
  backButton.style.display = "block";
}

function adjustFontSize() {
  const container = nameDisplay.parentElement;
  let minSize = 1;
  let maxSize = 1000;
  let fontSize;

  while (maxSize - minSize > 1) {
    fontSize = Math.floor((minSize + maxSize) / 2);
    nameDisplay.style.fontSize = `${fontSize}px`;

    if (
      nameDisplay.scrollWidth <= container.clientWidth &&
      nameDisplay.scrollHeight <= container.clientHeight
    ) {
      minSize = fontSize;
    } else {
      maxSize = fontSize;
    }
  }

  nameDisplay.style.fontSize = `${minSize}px`;

  const maxWidth = container.clientWidth * 0.5;
  if (nameDisplay.offsetWidth > maxWidth) {
    nameDisplay.style.fontSize = `${
      (minSize * maxWidth) / nameDisplay.offsetWidth
    }px`;
  }
}

function selectRandomName(topic) {
  hideAllSections();
  currentTopic = topic;
  let countdown = DEFAULT_COUNTDOWN;
  let availableNames = names[topic].filter((name) => name !== lastSelectedName);

  if (availableNames.length === 0) {
    availableNames = names[topic];
  }

  const randomName =
    availableNames[Math.floor(Math.random() * availableNames.length)];
  lastSelectedName = randomName;

  nameDisplay.style.display = "flex";
  nameDisplay.textContent = `이름을 선택 중... ${countdown}`;
  nameDisplay.classList.add("active");
  adjustFontSize();

  const timer = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      nameDisplay.textContent = `이름을 선택 중... ${countdown}`;
    } else {
      clearInterval(timer);
      nameDisplay.textContent = randomName;
      adjustFontSize();
      backButton.style.display = "block";
      retryButton.style.display = "block";
    }
  }, 1000);
}

function retrySelection() {
  selectRandomName(currentTopic);
}

function showInputForm() {
  hideAllSections();
  inputForm.classList.add("active");
  backButton.style.display = "block";
}

function submitName(e) {
  e.preventDefault();
  const name = nameInput.value;
  if (name) {
    hideAllSections();
    nameDisplay.style.display = "flex";
    nameDisplay.textContent = name;
    nameDisplay.classList.add("active");
    adjustFontSize();
    backButton.style.display = "block";
  }
}

function goBack() {
  hideAllSections();
  fullScreenButton.style.display = "block";
  themeToggleButton.style.display = "block";
  mainMenu.classList.add("active");
  title.style.display = "block";
  version.style.display = "block";
  backButton.style.display = "none";
}

function hideAllSections() {
  [mainMenu, topicList, inputForm, nameDisplay, version].forEach((el) =>
    el.classList.remove("active")
  );
  fullScreenButton.style.display = "none";
  themeToggleButton.style.display = "none";
  title.style.display = "none";
  version.style.display = "none";
  backButton.style.display = "none";
  retryButton.style.display = "none";
  nameDisplay.style.display = "none";
  nameDisplay.textContent = "";
  nameInput.value = "";
}

function toggleTheme() {
  setTheme(currentTheme === "light" ? "dark" : "light");
}

function toggleFullScreen() {
  if (!isFullScreen) {
    const docElm = document.documentElement;
    if (docElm.requestFullscreen) {
      docElm.requestFullscreen();
    } else if (docElm.mozRequestFullScreen) {
      docElm.mozRequestFullScreen();
    } else if (docElm.webkitRequestFullScreen) {
      docElm.webkitRequestFullScreen();
    } else if (docElm.msRequestFullscreen) {
      docElm.msRequestFullscreen();
    }
    fullScreenButton.textContent = "⬜️";
    isFullScreen = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    fullScreenButton.textContent = "⬛️";
    isFullScreen = false;
  }
}

function init() {
  setTheme(currentTheme);
  hideAllSections();
  fullScreenButton.style.display = "block";
  themeToggleButton.style.display = "block";
  mainMenu.classList.add("active");
  title.style.display = "block";
  version.style.display = "block";
  backButton.style.display = "none";
  retryButton.style.display = "none";
}

document.getElementById("randomBtn").onclick = showTopics;
document.getElementById("inputBtn").onclick = showInputForm;
inputForm.onsubmit = submitName;
backButton.onclick = goBack;
themeToggleButton.onclick = toggleTheme;
rotateButton.onclick = toggleRotation;
fullScreenButton.onclick = toggleFullScreen;
retryButton.onclick = retrySelection;

window.addEventListener("resize", () => {
  if (nameDisplay.classList.contains("active")) {
    adjustFontSize();
  }
});

rotateButton.onclick = () => {
  toggleRotation();
  requestAnimationFrame(() => {
    requestAnimationFrame(adjustFontSize);
  });
};

init();
