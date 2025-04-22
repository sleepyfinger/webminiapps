import { data } from "./data.js";

const mainMenu = document.getElementById("mainMenu");
const questionDisplay = document.getElementById("questionDisplay");
const backButton = document.getElementById("backButton");
const title = document.getElementById("title");
const version = document.getElementById("version");
const retryButton = document.getElementById("retryButton");
const answerArea = document.getElementById("answerArea");
const answerDisplay = document.getElementById("answerDisplay");
const explanationDisplay = document.getElementById("explanationDisplay");
const showAnswerButton = document.getElementById("showAnswerButton");

let shuffledQuestions = [];
let currentQuestionIndex = 0;
let wakeLock = null;

const optionButton = document.getElementById("optionButton");
const optionModal = document.getElementById("optionModal");
const closeButton = document.querySelector(".close-button");
const preventScreenOffCheckbox = document.getElementById("preventScreenOff");
const fullScreenCheckbox = document.getElementById("fullScreen");
const themeToggleCheckbox = document.getElementById("themeToggle");
const clickSound = document.getElementById("clickSound");

const questions = data.reduce((acc, item) => {
  (acc[item.topic] = acc[item.topic] || []).push({
    qst: item.qst,
    ans: item.ans,
    exp: item.exp,
  });
  return acc;
}, {});

const playClickSound = () => {
  clickSound.currentTime = 0;
  clickSound.play();
};

const addClickSoundToButtons = () => {
  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", playClickSound);
  });
};

const setTheme = (theme) => {
  document.body.classList.remove("light-theme", "dark-theme");
  document.body.classList.add(`${theme}-theme`);
  localStorage.setItem("theme", theme);
  themeToggleCheckbox.checked = theme === "dark";
};

const toggleTheme = () => {
  const currentTheme = localStorage.getItem("theme") || "dark";
  setTheme(currentTheme === "light" ? "dark" : "light");
};

const adjustFontSize = () => {
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
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const hideAllSections = () => {
  [mainMenu, questionDisplay, version].forEach((el) =>
    el.classList.remove("active")
  );
  title.style.display = "none";
  version.style.display = "none";
  backButton.style.display = "none";
  retryButton.style.display = "none";
  showAnswerButton.style.display = "none";
  answerArea.style.display = "none";
  questionDisplay.style.display = "none";
  questionDisplay.textContent = "";
};

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

const togglePreventScreenOff = async () => {
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
};

const selectRandomQuestionFromAll = () => {
  hideAllSections();
  const allQuestions = Object.values(questions).flat();

  if (allQuestions.length === 0) {
    questionDisplay.style.display = "flex";
    questionDisplay.textContent = `선택 가능한 질문이 없습니다.`;
    questionDisplay.classList.add("active");
    backButton.style.display = "block";
    return;
  }

  if (shuffledQuestions.length === 0) {
    shuffledQuestions = [...allQuestions];
    shuffleArray(shuffledQuestions);
    currentQuestionIndex = 0;
  }

  const selectedQuestion = shuffledQuestions[currentQuestionIndex];
  currentQuestionIndex++;
  if (currentQuestionIndex >= shuffledQuestions.length) {
    currentQuestionIndex = 0;
    shuffleArray(shuffledQuestions);
  }
  showQuestionAndAnswer(selectedQuestion);
};

const showQuestionAndAnswer = (questionData) => {
  questionDisplay.style.display = "flex";
  questionDisplay.classList.add("active");
  questionDisplay.textContent = questionData.qst;
  answerDisplay.textContent = "";

  showAnswerButton.onclick = () => showAnswer(questionData);
  showAnswerButton.style.display = "block";

  adjustFontSize();
  backButton.style.display = "block";
  retryButton.style.display = "block";
};

const showAnswer = (questionData) => {
  answerDisplay.textContent = `정답 : ${questionData.ans}`;
  explanationDisplay.textContent = questionData.exp;
  answerArea.style.display = "flex";
  showAnswerButton.style.display = "none";
  answerDisplay.style.display = "flex";
  explanationDisplay.style.display = "flex";
};

const retrySelection = () => selectRandomQuestionFromAll();

const goBack = () => {
  hideAllSections();
  mainMenu.classList.add("active");
  title.style.display = "block";
  version.style.display = "block";
  backButton.style.display = "none";
};

optionButton.addEventListener("click", () =>
  optionModal.classList.add("active")
);
closeButton.addEventListener("click", () =>
  optionModal.classList.remove("active")
);
window.addEventListener("click", (event) => {
  if (event.target === optionModal) optionModal.classList.remove("active");
});

document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    wakeLock = await navigator.wakeLock.request("screen");
  }
});
document.getElementById("randomBtn").onclick = selectRandomQuestionFromAll;
backButton.onclick = goBack;
retryButton.onclick = retrySelection;

const init = () => {
  addClickSoundToButtons();
  setTheme(localStorage.getItem("theme") || "dark");
  preventScreenOffCheckbox.checked = wakeLock !== null;
  fullScreenCheckbox.checked = false;
  themeToggleCheckbox.checked = localStorage.getItem("theme") === "dark";

  preventScreenOffCheckbox.addEventListener("change", togglePreventScreenOff);
  fullScreenCheckbox.addEventListener("change", toggleFullScreen);
  themeToggleCheckbox.addEventListener("change", toggleTheme);
  window.addEventListener("resize", () => {
    if (questionDisplay.classList.contains("active")) {
      adjustFontSize();
    }
  });
  hideAllSections();
  mainMenu.classList.add("active");
  title.style.display = "block";
  version.style.display = "block";
  backButton.style.display = "none";
  retryButton.style.display = "none";
};

init();
