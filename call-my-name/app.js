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

let currentTheme = "light";

// 테마 설정 함수
function setTheme(theme) {
  currentTheme = theme;
  themeStyle.setAttribute("href", `${currentTheme}-theme.css`);
  themeToggleButton.textContent = currentTheme === "light" ? "🌙" : "☀️";
}

// 초기 테마 설정
setTheme(currentTheme);

// 토픽 목록 표시 함수
function showTopics() {
  mainMenu.style.display = "none";
  topicList.innerHTML = "";
  topics.forEach((topic) => {
    const button = document.createElement("button");
    button.textContent = topic;
    button.onclick = () => selectRandomName(topic);
    topicList.appendChild(button);
  });
  topicList.style.display = "grid";
  backButton.style.display = "block";
  title.style.display = "none";
}

function handleOrientation() {
  if (window.innerWidth <= 768) {
    if (window.orientation === 0 || window.orientation === 180) {
      // 세로 모드일 때 가로 모드로 강제 전환
      document.body.style.transform = "rotate(90deg)";
      document.body.style.transformOrigin = "left top";
      document.body.style.width = "100vh";
      document.body.style.height = "100vw";
      document.body.style.overflow = "hidden";
      document.body.style.position = "absolute";
      document.body.style.top = "100%";
      document.body.style.left = "0";
    } else {
      // 이미 가로 모드일 때는 원래 상태로 복구
      document.body.style.transform = "";
      document.body.style.transformOrigin = "";
      document.body.style.width = "";
      document.body.style.height = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
    }
  }
}

// 페이지 로드 시와 화면 방향 변경 시 실행
window.addEventListener("load", handleOrientation);
window.addEventListener("orientationchange", handleOrientation);

// 랜덤 이름 선택 함수
function selectRandomName(topic) {
  let countdown = DEFAULT_COUNTDOWN;
  const randomName =
    names[topic][Math.floor(Math.random() * names[topic].length)];
  topicList.style.display = "none";
  nameDisplay.textContent = `이름을 선택 중... ${countdown}`;
  nameDisplay.style.display = "block";
  title.style.display = "none";
  backButton.style.display = "none";
  const timer = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      nameDisplay.textContent = `이름을 선택 중... ${countdown}`;
    } else {
      clearInterval(timer);
      nameDisplay.textContent = randomName;
      backButton.style.display = "block";
    }
  }, 1000);
}

// 직접 입력 폼 표시 함수
function showInputForm() {
  mainMenu.style.display = "none";
  inputForm.style.display = "flex";
  backButton.style.display = "block";
  title.style.display = "none";
  nameDisplay.style.display = "none";
}

// 이름 제출 함수
function submitName() {
  const name = document.getElementById("nameInput").value;
  if (name) {
    inputForm.style.display = "none";
    nameDisplay.textContent = name;
    nameDisplay.style.display = "block";
    title.style.display = "none";
    backButton.style.display = "block";
  }
}

// 뒤로 가기 함수
function goBack() {
  mainMenu.style.display = "flex";
  topicList.style.display = "none";
  inputForm.style.display = "none";
  nameDisplay.style.display = "none";
  nameDisplay.textContent = "";
  backButton.style.display = "none";
  title.style.display = "block";
}

function init() {
  backButton.style.display = "none";
}

// 테마 전환 함수
function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  themeStyle.setAttribute("href", `${currentTheme}-theme.css`);
  themeToggleButton.textContent = currentTheme === "light" ? "🌙" : "☀️";
}

// 초기 테마 설정
themeToggleButton.textContent = currentTheme === "light" ? "🌙" : "☀️";

// 이벤트 리스너 등록
document.getElementById("randomBtn").onclick = showTopics;
document.getElementById("inputBtn").onclick = showInputForm;
document.getElementById("submitName").onclick = submitName;
backButton.onclick = goBack;
themeToggleButton.onclick = toggleTheme;

init();
