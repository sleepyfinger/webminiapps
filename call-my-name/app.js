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

let currentTheme = "light";
let isRotated = false;

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

function selectRandomName(topic) {
  hideAllSections();
  let countdown = DEFAULT_COUNTDOWN;
  const randomName =
    names[topic][Math.floor(Math.random() * names[topic].length)];
  nameDisplay.textContent = `이름을 선택 중... ${countdown}`;
  nameDisplay.classList.add("active");

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
    nameDisplay.textContent = name;
    nameDisplay.classList.add("active");
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
  nameDisplay.textContent = "";
  nameInput.value = "";
}

function toggleTheme() {
  setTheme(currentTheme === "light" ? "dark" : "light");
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

init();
