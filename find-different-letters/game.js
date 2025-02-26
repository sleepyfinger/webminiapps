import { koreanCharsLevels } from "./data.js";

// HTML 요소 가져오기
const menu = document.getElementById("menu");
const game = document.getElementById("game");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const levelDisplay = document.getElementById("level");
const grid = document.getElementById("grid");
const progressBarFill = document.getElementById("progressBarFill");
const themeToggle = document.getElementById("theme-toggle");
const body = document.body;

// 게임 설정
const MAX_LEVEL = 150; // 최고 레벨 설정
const INITIAL_TIME = 10; // 초기 시간 설정
const TIME_DECREMENT = 0.5; // 레벨 증가에 따른 시간 감소량
const GRID_SIZE_INCREMENT = 1; // 레벨 증가에 따른 그리드 크기 증가량
const LEVEL_THRESHOLD = 5; // 난이도 레벨을 올리는 레벨 단위
const MAX_GRID_WIDTH = 6;
const MAX_GRID_HEIGHT = 8;

// 게임 변수
let level = 1;
let difficultyLevel = 0;
let timer;
let timeLeft;
let maxTime;
let lastUsedChars = [];
let highestLevel = localStorage.getItem("highestLevel") || 1;

const toggleTheme = () => {
  body.classList.toggle("dark-mode");
  themeToggle.textContent = body.classList.contains("dark-mode") ? "🌞" : "🌓";
};

themeToggle.addEventListener("click", toggleTheme);

// UI 업데이트 함수
function updateLevelDisplay() {
  levelDisplay.textContent = level;
}

function updateHighestLevelDisplay() {
  const highestLevelElements = document.querySelectorAll(
    '[id^="highestLevel"]'
  );
  highestLevelElements.forEach((element) => {
    element.textContent = highestLevel;
  });
}

function updateProgressBar() {
  const percentage = (timeLeft / maxTime) * 100;
  progressBarFill.style.width = `${percentage}%`;
}

function showMenu() {
  menu.style.display = "block";
  game.style.display = "none";
}

function showRestartButton() {
  restartButton.style.display = "block";
}

// 게임 로직 함수
function getRandomChar() {
  const chars = koreanCharsLevels[difficultyLevel];
  return chars[Math.floor(Math.random() * chars.length)];
}

function createGrid() {
  const gridSize = Math.min(level + GRID_SIZE_INCREMENT, MAX_GRID_WIDTH);
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
  grid.innerHTML = "";

  const totalCells = gridSize * gridSize;
  let targetChar, differentChar;

  do {
    targetChar = getRandomChar();
    differentChar = getRandomChar();
  } while (
    targetChar === differentChar ||
    lastUsedChars.includes(targetChar) ||
    lastUsedChars.includes(differentChar)
  );

  lastUsedChars = [targetChar, differentChar];
  const targetIndex = Math.floor(Math.random() * totalCells);

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = i === targetIndex ? differentChar : targetChar;
    cell.addEventListener("click", () => checkCell(i === targetIndex, cell));
    grid.appendChild(cell);
  }
}

function startTimer() {
  clearInterval(timer);
  updateProgressBar();
  timer = setInterval(() => {
    timeLeft -= 0.1;
    updateProgressBar();
    if (timeLeft <= 0) {
      clearInterval(timer);
      endGame(false);
    }
  }, 100);
}

function nextLevel() {
  updateLevelDisplay();
  difficultyLevel = Math.min(
    Math.floor((level - 1) / LEVEL_THRESHOLD),
    koreanCharsLevels.length - 1
  );
  createGrid();

  maxTime =
    level <= 9
      ? INITIAL_TIME
      : Math.max(INITIAL_TIME - (level - 9) * TIME_DECREMENT, 5);
  timeLeft = maxTime;
  startTimer();
}

function checkCell(isCorrect, cell) {
  if (timeLeft <= 0) {
    return;
  }

  if (isCorrect) {
    level++;
    if (level > MAX_LEVEL) {
      endGame(true);
    } else {
      clearInterval(timer);
      nextLevel();
    }
  }
}

function endGame(isSuccess) {
  clearInterval(timer);
  if (!isSuccess) {
    const correctCell = Array.from(grid.children).find(
      (cell) => cell.textContent !== grid.children[0].textContent
    );
    if (correctCell) {
      correctCell.classList.add("correct");
    }
    showRestartButton();
  }

  if (level > highestLevel) {
    highestLevel = level;
    localStorage.setItem("highestLevel", level);
    updateHighestLevelDisplay();
  }
}

function startGame() {
  menu.style.display = "none";
  game.style.display = "block";
  restartButton.style.display = "none";
  level = 1;
  difficultyLevel = 0;
  lastUsedChars = [];
  nextLevel();
}

// 이벤트 리스너 등록
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

// 초기화
updateHighestLevelDisplay();
