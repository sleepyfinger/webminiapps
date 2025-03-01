import { topics, questions } from "./data.js";

const DEFAULT_COUNTDOWN = 3;

const mainMenu = document.getElementById("mainMenu");
const topicList = document.getElementById("topicList");
const questionDisplay = document.getElementById("questionDisplay");
const backButton = document.getElementById("backButton");
const title = document.getElementById("title");
const version = document.getElementById("version");
const retryButton = document.getElementById("retryButton");

let currentTheme = "dark";
let isFullScreen = false;
let currentTopic = "";
let lastSelectedQuestion = ""; //마지막으로 선택된 질문
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
  playClickSound(); // 클릭 소리 재생
  optionModal.classList.add("active");
});

// 닫기 버튼 클릭 시 모달 숨김
closeButton.addEventListener("click", () => {
  playClickSound(); // 클릭 소리 재생
  optionModal.classList.remove("active");
});

// 모달 외부 클릭 시 모달 숨김
window.addEventListener("click", (event) => {
  if (event.target == optionModal) {
    playClickSound(); // 클릭 소리 재생
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
  document.body.classList.remove("light-theme", "dark-theme");
  document.body.classList.add(`${theme}-theme`);
  localStorage.setItem("theme", theme);
  // 테마 변경 시 체크박스 상태 동기화
  themeToggleCheckbox.checked = currentTheme === "dark";
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

//모든 질문에서 랜덤하게 선택
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

function goBack() {
  hideAllSections();
  mainMenu.classList.add("active");
  title.style.display = "block";
  version.style.display = "block";
  backButton.style.display = "none";
}

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
  // 로컬 스토리지에서 테마 불러오기
  const savedTheme = localStorage.getItem("theme");
  currentTheme = savedTheme || "dark"; // 저장된 테마가 없으면 기본값은 dark
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
  //초기값 반영.
  themeToggleCheckbox.checked = currentTheme === "dark";

  preventScreenOffCheckbox.addEventListener("change", togglePreventScreenOff);
  fullScreenCheckbox.addEventListener("change", toggleFullScreen);
  // 테마 변경 이벤트 리스너 연결
  themeToggleCheckbox.addEventListener("change", toggleTheme);

  window.addEventListener("resize", () => {
    if (questionDisplay.classList.contains("active")) {
      adjustFontSize();
    }
  });
}

init();
