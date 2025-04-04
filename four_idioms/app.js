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

let currentQuestion = null;

async function fetchRandomQuestion() {
  showLoading();
  try {
    const response = await fetch("idioms.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const randomIndex = Math.floor(Math.random() * data.length);
    currentQuestion = data[randomIndex];
    return currentQuestion;
  } catch (error) {
    console.error("Error fetching question:", error);
    return null;
  } finally {
    hideLoading();
  }
}

function displayQuestion(question) {
  questionDisplay.textContent = question.question;
  answerDisplay.textContent = "";
}

function displayAnswer(question) {
  answerDisplay.textContent = question.answer;
}

function showLoading() {
  loadingOverlay.style.display = "flex";
}

function hideLoading() {
  loadingOverlay.style.display = "none";
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
    displayAnswer(currentQuestion);
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
