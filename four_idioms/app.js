const randomBtn = document.getElementById("randomBtn");
const mainMenu = document.getElementById("mainMenu");
const questionArea = document.getElementById("questionArea");
const questionDisplay = document.getElementById("questionDisplay");
const answerDisplay = document.getElementById("answerDisplay");
const showAnswerButton = document.getElementById("showAnswerButton");
const retryButton = document.getElementById("retryButton");
const backButton = document.getElementById("backButton");
const optionButton = document.getElementById("optionButton");
const optionModal = document.getElementById("optionModal");
const closeButton = document.getElementById("closeButton");
const preventScreenOffCheckbox = document.getElementById("preventScreenOff");
const fullScreenCheckbox = document.getElementById("fullScreen");
const loadingOverlay = document.querySelector(".loading-overlay");
const quizBtn = document.getElementById("quizBtn");
const quizArea = document.getElementById("quizArea");
const quizQuestion = document.getElementById("quizQuestion");
const quizOptions = document.getElementById("quizOptions");
const quizBackButton = document.getElementById("quizBackButton");

let currentQuestion = null;
let answerVisible = false;
let currentQuizQuestion = {};
let quizData = [];
let idiomsData = [];
let timerId = null;
let isCheckingAnswer = false;

async function fetchRandomQuestion() {
  showLoading();
  try {
    const response = await fetch("idioms.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    idiomsData = await response.json();
    const randomIndex = Math.floor(Math.random() * idiomsData.length);
    currentQuestion = idiomsData[randomIndex];
    return currentQuestion;
  } catch (error) {
    console.error("Error fetching question:", error);
    return null;
  } finally {
    hideLoading();
  }
}

async function fetchQuizData() {
  showLoading();
  try {
    const response = await fetch("quiz.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    quizData = await response.json();
  } catch (error) {
    console.error("Error fetching quiz data:", error);
  } finally {
    hideLoading();
  }
}

function displayQuestion(question) {
  questionDisplay.textContent = question.question;
  answerDisplay.textContent = "";
  answerVisible = false;
  showAnswerButton.textContent = "정답 보기";
}

function displayAnswer(question) {
  answerDisplay.textContent = question.answer;
}

function hideAnswer() {
  answerDisplay.textContent = "";
}

function showLoading() {
  loadingOverlay.style.display = "flex";
}

function hideLoading() {
  loadingOverlay.style.display = "none";
}

function startQuiz() {
  mainMenu.classList.remove("active");
  mainMenu.classList.add("hidden");
  quizArea.classList.remove("hidden");
  quizArea.classList.add("active");
  loadQuestion();
}

function loadQuestion() {
  isCheckingAnswer = false;
  clearTimeout(timerId);
  const randomIndex = Math.floor(Math.random() * quizData.length);
  currentQuizQuestion = quizData[randomIndex];
  quizQuestion.textContent = currentQuizQuestion.question;

  const shuffledOptions = shuffleArray(currentQuizQuestion.options);

  const optionButtons = quizOptions.querySelectorAll(".quizOption");
  optionButtons.forEach((button, index) => {
    button.textContent = shuffledOptions[index];
    button.classList.remove("correct", "incorrect", "show-answer");
    button.removeEventListener("click", checkAnswer);
    button.addEventListener("click", checkAnswer);
  });
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function checkAnswer(event) {
  if (isCheckingAnswer) {
    return;
  }
  isCheckingAnswer = true;
  clearTimeout(timerId);
  const selectedButton = event.target;
  const selectedAnswer = selectedButton.textContent;
  const optionButtons = quizOptions.querySelectorAll(".quizOption");

  if (selectedAnswer === currentQuizQuestion.answer) {
    selectedButton.classList.add("correct");
    selectedButton.textContent = "정답입니다!";
  } else {
    selectedButton.classList.add("incorrect");
    selectedButton.textContent = "틀렸습니다!";
    optionButtons.forEach((button) => {
      if (button.textContent === currentQuizQuestion.answer) {
        button.classList.add("show-answer");
      }
    });
  }

  timerId = setTimeout(() => {
    loadQuestion();
  }, 1000);
}

function backToMenu() {
  quizArea.classList.remove("active");
  quizArea.classList.add("hidden");
  mainMenu.classList.remove("hidden");
  mainMenu.classList.add("active");
}

randomBtn.addEventListener("click", async () => {
  const question = await fetchRandomQuestion();
  if (question) {
    displayQuestion(question);
    mainMenu.classList.remove("active");
    mainMenu.classList.add("hidden");
    questionArea.classList.remove("hidden");
    questionArea.classList.add("active");
  }
});

showAnswerButton.addEventListener("click", () => {
  if (currentQuestion) {
    if (answerVisible) {
      hideAnswer();
      showAnswerButton.textContent = "정답 보기";
      answerVisible = false;
    } else {
      displayAnswer(currentQuestion);
      showAnswerButton.textContent = "정답 숨기기";
      answerVisible = true;
    }
  }
});

retryButton.addEventListener("click", async () => {
  const question = await fetchRandomQuestion();
  if (question) {
    displayQuestion(question);
  }
});

backButton.addEventListener("click", () => {
  mainMenu.classList.remove("hidden");
  mainMenu.classList.add("active");
  questionArea.classList.remove("active");
  questionArea.classList.add("hidden");
  hideAnswer();
  showAnswerButton.textContent = "정답 보기";
  answerVisible = false;
});

optionButton.addEventListener("click", () => {
  optionModal.style.display = "block";
});

closeButton.addEventListener("click", () => {
  optionModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === optionModal) {
    optionModal.style.display = "none";
  }
});

preventScreenOffCheckbox.addEventListener("change", (event) => {
  if (event.target.checked) {
    console.log("Prevent screen off enabled");
  } else {
    console.log("Prevent screen off disabled");
  }
});

fullScreenCheckbox.addEventListener("change", (event) => {
  if (event.target.checked) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
});

quizBtn.addEventListener("click", startQuiz);
quizBackButton.addEventListener("click", backToMenu);

fetchQuizData();
