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
const nameInput = document.getElementById("nameInput");
const rotateButton = document.getElementById("rotateButton");
const retryButton = document.getElementById("retryButton");
const logo = document.getElementById("logo"); // Add logo

let currentTheme = "dark";
let isRotated = false;
let isFullScreen = false;
let currentTopic = "";
let lastSelectedName = "";
let wakeLock = null; // 화면 꺼짐 방지

// 옵션 관련 변수
const optionButton = document.getElementById("optionButton");
const optionModal = document.getElementById("optionModal");
const closeButton = document.querySelector(".close-button");
const preventScreenOffCheckbox = document.getElementById("preventScreenOff");
const fullScreenCheckbox = document.getElementById("fullScreen");
const themeToggleCheckbox = document.getElementById("themeToggle");
const clickSound = document.getElementById("clickSound");

// 옵션 버튼 클릭 시 모달 표시
optionButton.addEventListener("click", () => {
  optionModal.classList.add("active");
});

// 닫기 버튼 클릭 시 모달 숨김
closeButton.addEventListener("click", () => {
  optionModal.classList.remove("active");
});

// 모달 외부 클릭 시 모달 숨김
window.addEventListener("click", (event) => {
  if (event.target == optionModal) {
    optionModal.classList.remove("active");
  }
});

// 페이지 가시성 변경 시 WakeLock 재요청
document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    wakeLock = await navigator.wakeLock.request("screen");
  }
});

function playClickSound() {
  clickSound.currentTime = 0;
  clickSound.play();
}

function addClickSoundToButtons() {
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.addEventListener("click", playClickSound);
  });
}

function setTheme(theme) {
  currentTheme = theme;
  themeStyle.setAttribute("href", `${currentTheme}-theme.css`);
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
  logo.style.display = "none";
  topicList.innerHTML = "";
  topics.forEach((topic) => {
    const button = document.createElement("button");
    button.textContent = topic;
    button.onclick = () => {
      playClickSound();
      selectRandomName(topic);
    };
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
  logo.style.display = "none";
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
  logo.style.display = "none";
  inputForm.classList.add("active");
  backButton.style.display = "block";
}

function submitName(e) {
  e.preventDefault();
  const name = nameInput.value;
  if (name) {
    hideAllSections();
    logo.style.display = "none";
    nameDisplay.style.display = "flex";
    nameDisplay.textContent = name;
    nameDisplay.classList.add("active");
    adjustFontSize();
    backButton.style.display = "block";
  }
}

function goBack() {
  hideAllSections();
  logo.style.display = "block";
  mainMenu.classList.add("active");
  title.style.display = "block";
  version.style.display = "block";
  backButton.style.display = "none";
}

function hideAllSections() {
  [mainMenu, topicList, inputForm, nameDisplay, version].forEach((el) =>
    el.classList.remove("active")
  );
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
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    isFullScreen = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    isFullScreen = false;
  }
}

async function togglePreventScreenOff() {
  if (!wakeLock) {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      console.log("Wake Lock 활성화");
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
      preventScreenOffCheckbox.checked = false;
    }
  } else {
    await wakeLock.release();
    wakeLock = null;
    console.log("Wake Lock 비활성화");
  }
}

function init() {
  addClickSoundToButtons();
  setTheme(currentTheme);
  hideAllSections();
  mainMenu.classList.add("active");
  title.style.display = "block";
  version.style.display = "block";
  backButton.style.display = "none";
  retryButton.style.display = "none";
  logo.style.display = "block";

  document.getElementById("randomBtn").onclick = showTopics;
  document.getElementById("inputBtn").onclick = showInputForm;
  inputForm.onsubmit = submitName;
  backButton.onclick = goBack;
  retryButton.onclick = retrySelection;

  preventScreenOffCheckbox.checked = wakeLock !== null;
  fullScreenCheckbox.checked = isFullScreen;
  themeToggleCheckbox.checked = currentTheme === "dark";

  preventScreenOffCheckbox.addEventListener("change", togglePreventScreenOff);
  fullScreenCheckbox.addEventListener("change", toggleFullScreen);
  themeToggleCheckbox.addEventListener("change", toggleTheme);

  window.addEventListener("resize", () => {
    if (nameDisplay.classList.contains("active")) {
      adjustFontSize();
    }
  });
}

rotateButton.onclick = () => {
  toggleRotation();
  requestAnimationFrame(() => {
    requestAnimationFrame(adjustFontSize);
  });
};

init();
