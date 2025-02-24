import { topics, names } from "./data.js";

const DEFAULT_COUNTDOWN = 5;

const mainMenu = document.getElementById("mainMenu");
const topicList = document.getElementById("topicList");
const inputForm = document.getElementById("inputForm");
const nameDisplay = document.getElementById("nameDisplay");
const backButton = document.getElementById("backButton");
const title = document.getElementById("title");
const themeStyle = document.getElementById("theme-style");
const themeToggleButton = document.getElementById("theme-toggle-button");
const nameInput = document.getElementById("nameInput");
const rotateButton = document.getElementById("rotateButton");
const fullScreenButton = document.getElementById("fullScreenButton");

let currentTheme = "dark";
let isRotated = false;
let isFullScreen = false;

// 화면 꺼짐 방지
let wakeLock = null;

const requestWakeLock = async () => {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    console.log("Wake Lock is active!");
    wakeLock.addEventListener("release", () => {
      console.log("Wake Lock was released");
    });
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
};

const releaseWakeLock = async () => {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
};

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
  const nameDisplay = document.getElementById("nameDisplay");
  const container = nameDisplay.parentElement;
  let fontSize = 10; // 시작 폰트 크기를 작게 설정
  nameDisplay.style.fontSize = `${fontSize}px`;

  // 폰트 크기를 점진적으로 증가시키며 최적 크기를 찾음
  while (
    nameDisplay.scrollWidth <= container.clientWidth &&
    nameDisplay.scrollHeight <= container.clientHeight
  ) {
    fontSize++;
    nameDisplay.style.fontSize = `${fontSize}px`;
  }

  // 마지막으로 증가된 크기에서 1px 줄여 정확히 맞는 크기로 설정
  fontSize--;
  nameDisplay.style.fontSize = `${fontSize}px`;

  // 최대 넓이의 90%를 넘지 않도록 조정
  const maxWidth = container.clientWidth * 0.9;
  if (nameDisplay.offsetWidth > maxWidth) {
    nameDisplay.style.fontSize = `${
      (fontSize * maxWidth) / nameDisplay.offsetWidth
    }px`;
  }
}

function selectRandomName(topic) {
  hideAllSections();
  let countdown = DEFAULT_COUNTDOWN;
  const randomName =
    names[topic][Math.floor(Math.random() * names[topic].length)];
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
      adjustFontSize(); // 폰트 크기 조절
      backButton.style.display = "block";
    }
  }, 1000);
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
    adjustFontSize(); // 폰트 크기 조절
    backButton.style.display = "block";
  }
}

function goBack() {
  hideAllSections();
  mainMenu.classList.add("active");
  title.style.display = "block";
  backButton.style.display = "none";
}

function hideAllSections() {
  [mainMenu, topicList, inputForm, nameDisplay].forEach((el) =>
    el.classList.remove("active")
  );
  title.style.display = "none";
  backButton.style.display = "none";
  nameDisplay.style.display = "none";
  nameDisplay.textContent = "";
  nameInput.value = "";
}

function toggleTheme() {
  setTheme(currentTheme === "light" ? "dark" : "light");
}

function toggleFullScreen() {
  if (!isFullScreen) {
    // 전체화면 모드로 전환
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
    fullScreenButton.textContent = "⬜️"; // 아이콘 변경
    isFullScreen = true;
    requestWakeLock(); // 화면 꺼짐 방지 활성화
  } else {
    // 전체화면 모드 해제
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    fullScreenButton.textContent = "⬛️"; // 아이콘 원복
    isFullScreen = false;
    releaseWakeLock(); // 화면 꺼짐 방지 해제
  }
}

function init() {
  setTheme(currentTheme);
  hideAllSections();
  mainMenu.classList.add("active");
  title.style.display = "block";
  backButton.style.display = "none";
}

document.getElementById("randomBtn").onclick = showTopics;
document.getElementById("inputBtn").onclick = showInputForm;
inputForm.onsubmit = submitName;
backButton.onclick = goBack;
themeToggleButton.onclick = toggleTheme;
rotateButton.onclick = toggleRotation;
fullScreenButton.onclick = toggleFullScreen;

window.addEventListener("resize", () => {
  if (nameDisplay.classList.contains("active")) {
    adjustFontSize();
  }
});

// 회전 버튼 클릭 시에도 폰트 크기 조정
rotateButton.addEventListener("click", () => {
  setTimeout(adjustFontSize, 100); // 회전 애니메이션이 완료된 후 크기 조정
});

init();
