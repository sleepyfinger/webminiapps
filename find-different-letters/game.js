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
let highestLevel = localStorage.getItem("highestLevel") || 1;

// 정답 셀 정보 저장 변수 (전역 변수로 선언)
let targetIndex; // 정답 셀의 인덱스
let targetCell; // 정답 셀의 HTML element
let differentChar; // 정답 셀의 textContent

/**
 * 테마를 토글하는 함수 (다크 모드/라이트 모드 전환)
 * 현재 body에 'dark-mode' 클래스가 있는지 확인하고, 있으면 제거하고 없으면 추가합니다.
 * 테마에 따라 이모지 아이콘을 변경합니다.
 */
const toggleTheme = () => {
  body.classList.toggle("dark-mode");
  themeToggle.textContent = body.classList.contains("dark-mode") ? "🌞" : "🌓";
};

themeToggle.addEventListener("click", toggleTheme);

/**
 * 현재 레벨을 UI에 업데이트하는 함수
 * levelDisplay 엘리먼트에 현재 레벨을 표시합니다.
 */
function updateLevelDisplay() {
  levelDisplay.textContent = level;
}

/**
 * 최고 레벨을 UI에 업데이트하는 함수
 * 'highestLevel'로 시작하는 id를 가진 모든 엘리먼트에 최고 레벨을 표시합니다.
 */
function updateHighestLevelDisplay() {
  const highestLevelElements = document.querySelectorAll(
    '[id^="highestLevel"]'
  );
  highestLevelElements.forEach((element) => {
    element.textContent = highestLevel;
  });
}

/**
 * 프로그레스 바를 업데이트하는 함수
 * 남은 시간을 바탕으로 프로그레스 바의 너비를 조정합니다.
 */
function updateProgressBar() {
  const percentage = (timeLeft / maxTime) * 100;
  progressBarFill.style.width = `${percentage}%`;
}

/**
 * 메뉴를 보여주는 함수
 * 메뉴를 표시하고 게임 화면을 숨깁니다.
 */
function showMenu() {
  menu.style.display = "block";
  game.style.display = "none";
}

/**
 * 재시작 버튼을 보여주는 함수
 * 재시작 버튼을 표시합니다.
 */
function showRestartButton() {
  restartButton.style.display = "block";
}

/**
 * 랜덤한 한글 자음 또는 모음을 반환하는 함수
 * 현재 난이도에 맞는 한글 문자 배열에서 랜덤한 문자를 선택합니다.
 */
function getRandomChar() {
  const chars = koreanCharsLevels[difficultyLevel];
  return chars[Math.floor(Math.random() * chars.length)];
}

/**
 * 게임 그리드를 생성하는 함수
 * 현재 레벨에 따라 그리드 크기를 조정하고, 목표 문자와 다른 문자를 배치합니다.
 */
async function createGrid() {
  const gridSize = Math.min(level + GRID_SIZE_INCREMENT, MAX_GRID_WIDTH);
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
  grid.innerHTML = "";

  const totalCells = gridSize * gridSize;
  let targetChar;

  do {
    targetChar = getRandomChar();
    differentChar = getRandomChar();
  } while (targetChar === differentChar);

  targetIndex = Math.floor(Math.random() * totalCells);

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = i === targetIndex ? differentChar : targetChar;
    cell.addEventListener("click", () => checkCell(i === targetIndex, cell));
    // 정답 셀인 경우, targetCell에 저장
    if (i === targetIndex) {
      targetCell = cell;
    }
    grid.appendChild(cell);

    // 등장 연출을 위한 초기 설정
    cell.style.opacity = 1;
    cell.style.transform = "scale(1)";
    cell.style.transition = "opacity 0.3s, transform 0.3s";

    // 등장 연출 실행 (비동기 처리)
    await new Promise((resolve) => {
      setTimeout(() => {
        cell.style.opacity = 1;
        cell.style.transform = "scale(1)";
        resolve();
      }, 0); // 각 셀이 나타나는 시간 간격 (밀리초)
    });
  }
}

/**
 * 게임 타이머를 시작하는 함수
 * 일정 시간마다 남은 시간을 감소시키고, 프로그레스 바를 업데이트합니다.
 */
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

/**
 * 다음 레벨로 진행하는 함수
 * 레벨을 증가시키고, 난이도를 업데이트하고, 새로운 그리드를 생성하고, 타이머를 시작합니다.
 */
async function nextLevel() {
  updateLevelDisplay();
  difficultyLevel = Math.min(
    Math.floor((level - 1) / LEVEL_THRESHOLD),
    koreanCharsLevels.length - 1
  );
  await createGrid();

  maxTime =
    level <= 9
      ? INITIAL_TIME
      : Math.max(INITIAL_TIME - (level - 9) * TIME_DECREMENT, 5);
  timeLeft = maxTime;
  startTimer();
}

/**
 * 셀을 클릭했을 때 호출되는 함수
 * 클릭한 셀이 정답인지 확인하고, 정답이면 레벨을 올리고, 오답이면 게임을 종료합니다.
 */
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

/**
 * 게임을 종료하는 함수
 * 게임 타이머를 중지하고, 성공 또는 실패에 따른 UI 업데이트를 수행합니다.
 * 최고 레벨을 갱신하고 저장합니다.
 */
function endGame(isSuccess) {
  clearInterval(timer);
  if (!isSuccess) {
    // targetCell을 바로 사용
    if (targetCell) {
      targetCell.classList.add("correct");
    }
    showRestartButton();
  }

  if (level > highestLevel) {
    highestLevel = level;
    localStorage.setItem("highestLevel", level);
    updateHighestLevelDisplay();
  }
}

/**
 * 게임을 시작하는 함수
 * 메뉴를 숨기고 게임을 표시하며, 게임 변수를 초기화하고 첫 레벨을 시작합니다.
 */
async function startGame() {
  menu.style.display = "none";
  game.style.display = "block";
  restartButton.style.display = "none";
  level = 1;
  difficultyLevel = 0;
  await nextLevel();
}

// 이벤트 리스너 등록
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

// 초기화
updateHighestLevelDisplay();
