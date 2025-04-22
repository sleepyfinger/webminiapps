import { topics, questions } from "./data.js";

const DEFAULT_COUNTDOWN = 3;

const mainMenu = document.getElementById("mainMenu");
const topicList = document.getElementById("topicList");
const questionDisplay = document.getElementById("questionDisplay");
const backButton = document.getElementById("backButton");
const title = document.getElementById("title");
const version = document.getElementById("version");
const retryButton = document.getElementById("retryButton");
const optionButton = document.getElementById("optionButton");
const optionModal = document.getElementById("optionModal");
const closeButton = document.querySelector(".close-button");
const preventScreenOffCheckbox = document.getElementById("preventScreenOff");
const fullScreenCheckbox = document.getElementById("fullScreen");
const themeToggleCheckbox = document.getElementById("themeToggle");
const clickSound = document.getElementById("clickSound");

let currentTheme = "dark";
let isFullScreen = false;
let currentTopic = "";
let lastSelectedQuestion = "";
let wakeLock = null;

// --- Sound ---
function playClickSound() {
  clickSound.currentTime = 0;
  clickSound.play();
}

function addClickSoundToButtons() {
  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", playClickSound);
  });
}
// --- Theme ---
function setTheme(theme) {
  currentTheme = theme;
  document.body.classList.remove("light-theme", "dark-theme");
  document.body.classList.add(`${theme}-theme`);
  localStorage.setItem("theme", theme);
  themeToggleCheckbox.checked = currentTheme === "dark";
}

function toggleTheme() {
  setTheme(currentTheme === "light" ? "dark" : "light");
}
// --- UI ---
function hideAllSections() {
  [mainMenu, topicList, questionDisplay, version].forEach((el) =>
    el.classList.remove("active")
  );
  title.style.display = "none";
  version.style.display = "none";
  backButton.style.display = "none";
  retryButton.style.display = "none";
  questionDisplay.style.display = "none";
  questionDisplay.textContent = "";
}

function adjustFontSize() {
  const container = questionDisplay.parentElement;
  let minSize = 1;
  let maxSize = 1000;
  let fontSize;
  while (maxSize - minSize > 1) {
    fontSize = Math.floor((minSize + maxSize) / 2);
    questionDisplay.style.fontSize = `${fontSize}px`;
    if (
      questionDisplay.scrollWidth <= container.clientWidth &&
      questionDisplay.scrollHeight <= container.clientHeight
    ) {
      minSize = fontSize;
    } else {
      maxSize = fontSize;
    }
  }
  questionDisplay.style.fontSize = `${minSize}px`;
  const maxWidth = container.clientWidth * 0.3;
  if (questionDisplay.offsetWidth > maxWidth) {
    questionDisplay.style.fontSize = `${
      (minSize * maxWidth) / questionDisplay.offsetWidth
    }px`;
  }
}

function showTopics() {
  hideAllSections();
  topicList.innerHTML = "";
  topics.forEach((topic) => {
    const button = document.createElement("button");
    button.textContent = topic;
    button.onclick = () => {
      playClickSound();
      selectRandomQuestion(topic);
    };
    topicList.appendChild(button);
  });
  topicList.classList.add("active");
  backButton.style.display = "block";
}

function goBack() {
  hideAllSections();
  mainMenu.classList.add("active");
  title.style.display = "block";
  version.style.display = "block";
  backButton.style.display = "none";
}
// --- Question ---
function selectRandomQuestion(topic) {
  hideAllSections();
  currentTopic = topic;
  let countdown = DEFAULT_COUNTDOWN;
  let availableQuestions = questions[topic].filter(
    (question) => question !== lastSelectedQuestion
  );

  if (availableQuestions.length === 0) {
    availableQuestions = questions[topic];
  }

  const randomQuestion =
    availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  lastSelectedQuestion = randomQuestion;

  questionDisplay.style.display = "flex";
  questionDisplay.textContent = `질문을 선택 중... ${countdown}`;
  questionDisplay.classList.add("active");
  adjustFontSize();
  const timer = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      questionDisplay.textContent = `질문을 선택 중... ${countdown}`;
    } else {
      clearInterval(timer);
      questionDisplay.textContent = randomQuestion;
      adjustFontSize();
      backButton.style.display = "block";
      retryButton.style.display = "block";
    }
  }, 1000);
}

function selectRandomQuestionFromAll() {
  hideAllSections();
  const allQuestions = [];
  for (const topic in questions) {
    allQuestions.push(...questions[topic]);
  }

  let countdown = DEFAULT_COUNTDOWN;

  let availableQuestions = allQuestions.filter(
    (question) => question !== lastSelectedQuestion
  );

  if (availableQuestions.length === 0) {
    availableQuestions = allQuestions;
  }

  const randomQuestion =
    availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  lastSelectedQuestion = randomQuestion;

  questionDisplay.style.display = "flex";
  questionDisplay.textContent = `질문을 선택 중... ${countdown}`;
  questionDisplay.classList.add("active");
  adjustFontSize();

  const timer = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      questionDisplay.textContent = `질문을 선택 중... ${countdown}`;
    } else {
      clearInterval(timer);
      questionDisplay.textContent = randomQuestion;
      adjustFontSize();
      backButton.style.display = "block";
      retryButton.style.display = "block";
    }
  }, 1000);
}

function retrySelection() {
  if (currentTopic === "") {
    selectRandomQuestionFromAll();
  } else {
    selectRandomQuestion(currentTopic);
  }
}
// --- Option ---
optionButton.addEventListener("click", () => {
  playClickSound();
  optionModal.classList.add("active");
});

closeButton.addEventListener("click", () => {
  playClickSound();
  optionModal.classList.remove("active");
});

window.addEventListener("click", (event) => {
  if (event.target === optionModal) {
    playClickSound();
    optionModal.classList.remove("active");
  }
});

async function togglePreventScreenOff() {
  if (!wakeLock) {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
    } catch (err) {
      preventScreenOffCheckbox.checked = false;
    }
  } else {
    await wakeLock.release();
    wakeLock = null;
  }
}

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    isFullScreen = true;
  } else {
    document.exitFullscreen();
    isFullScreen = false;
  }
}
// --- Event ---
document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    wakeLock = await navigator.wakeLock.request("screen");
  }
});

window.addEventListener("resize", () => {
  if (questionDisplay.classList.contains("active")) {
    adjustFontSize();
  }
});
// --- Init ---
function init() {
  addClickSoundToButtons();
  const savedTheme = localStorage.getItem("theme");
  currentTheme = savedTheme || "dark";
  setTheme(currentTheme);
  hideAllSections();
  mainMenu.classList.add("active");
  title.style.display = "block";
  version.style.display = "block";
  backButton.style.display = "none";
  retryButton.style.display = "none";

  document.getElementById("randomBtn").onclick = () => {
    currentTopic = "";
    selectRandomQuestionFromAll();
  };
  document.getElementById("inputBtn").onclick = showTopics;
  backButton.onclick = goBack;
  retryButton.onclick = retrySelection;

  preventScreenOffCheckbox.checked = wakeLock !== null;
  fullScreenCheckbox.checked = isFullScreen;
  themeToggleCheckbox.checked = currentTheme === "dark";

  preventScreenOffCheckbox.addEventListener("change", togglePreventScreenOff);
  fullScreenCheckbox.addEventListener("change", toggleFullScreen);
  themeToggleCheckbox.addEventListener("change", toggleTheme);
}

init();
