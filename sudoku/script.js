const BOARD_SIZE = 9;
const BOX_SIZE = 3;
const DIFFICULTIES = { EASY: 1, MEDIUM: 40, HARD: 50 };
const INITIAL_BOARD_VALUE = 0;

const boardElement = document.getElementById("board");
const digitsElement = document.getElementById("digits");
const newGameButton = document.getElementById("newGame");
const solveButton = document.getElementById("solve");
const undoButton = document.getElementById("undo");
const togglePencilButton = document.getElementById("togglePencil");
const themeToggle = document.getElementById("theme-toggle");
const difficultyPopup = document.getElementById("difficultyPopup");

let board = [];
let solution = [];
let selectedTile = null;
let history = [];
let isPencilMode = false;
let selectedNumber = null;
let currentDifficulty = "medium";

// --- 유틸리티 함수 ---

/** 보드 초기화 */
function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(INITIAL_BOARD_VALUE)
  );
}

/** 스도쿠 보드를 무작위로 채움 */
function fillBoardRandomly(board) {
  const numbers = Array.from({ length: 9 }, (_, i) => i + 1);
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === INITIAL_BOARD_VALUE) {
        shuffleArray(numbers);
        let filled = false;
        for (let k = 0; k < numbers.length; k++) {
          if (isValid(board, i, j, numbers[k])) {
            board[i][j] = numbers[k];
            filled = true;
            break;
          }
        }
        if (!filled) {
          return false; // 숫자를 채우지 못한 경우 false 반환
        }
      }
    }
  }
  return true; // 정상적으로 채워진 경우 true 반환
}

/** 배열을 섞음 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
/** 보드에서 숫자 제거 */
function removeNumbers(numbersToRemove) {
  const possibleIndexes = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] !== INITIAL_BOARD_VALUE) {
        possibleIndexes.push({ row, col });
      }
    }
  }

  let removedCount = 0;
  while (removedCount < numbersToRemove && possibleIndexes.length > 0) {
    const randomIndex = Math.floor(Math.random() * possibleIndexes.length);
    const { row, col } = possibleIndexes[randomIndex];
    board[row][col] = INITIAL_BOARD_VALUE;
    possibleIndexes.splice(randomIndex, 1);
    removedCount++;
  }
}

/** 스도쿠 유효성 검사 */
function isValid(board, row, col, num) {
  return (
    !isInRow(board, row, num) &&
    !isInCol(board, col, num) &&
    !isInBox(board, row, col, num)
  );
}

/** 행에 숫자 존재 여부 */
function isInRow(board, row, num) {
  return board[row].includes(num);
}

/** 열에 숫자 존재 여부 */
function isInCol(board, col, num) {
  return board.some((row) => row[col] === num);
}

/** 박스에 숫자 존재 여부 */
function isInBox(board, row, col, num) {
  const boxStartRow = row - (row % BOX_SIZE);
  const boxStartCol = col - (col % BOX_SIZE);
  for (let i = 0; i < BOX_SIZE; i++) {
    for (let j = 0; j < BOX_SIZE; j++) {
      if (board[i + boxStartRow][j + boxStartCol] === num) return true;
    }
  }
  return false;
}

/** 게임 승리 여부 확인 */
function checkWin() {
  if (JSON.stringify(board) === JSON.stringify(solution)) {
    alert("축하합니다! 스도쿠를 완성했습니다!");
  }
}
/** 마지막 동작 취소 */
function undo() {
  if (history.length > 0) {
    const lastMove = history.pop();
    board[lastMove.row][lastMove.col] = lastMove.value;
    renderBoard();
  }
}

// --- UI 렌더링 함수 ---

/** 타일 요소 생성 */
function createTileElement(row, col) {
  const tile = document.createElement("div");
  tile.classList.add("tile");

  if (board[row][col] !== INITIAL_BOARD_VALUE) {
    tile.textContent = board[row][col];
    tile.classList.add("given");
  } else {
    tile.dataset.pencil = "";
  }

  tile.addEventListener("click", () => selectTile(tile, row, col));
  return tile;
}

/** 숫자 버튼 요소 생성 */
function createDigitElement(num) {
  const digit = document.createElement("button");
  digit.classList.add("digit");
  digit.textContent = num;
  digit.addEventListener("click", () => selectDigit(num));
  return digit;
}

/** 보드 렌더링 */
function renderBoard() {
  boardElement.innerHTML = "";
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      const tile = createTileElement(i, j);
      boardElement.appendChild(tile);
    }
  }
  highlightRelatedCells();
  highlightErrors();
}

/** 숫자 버튼 렌더링 */
function renderDigits() {
  digitsElement.innerHTML = "";
  for (let i = 1; i <= BOARD_SIZE; i++) {
    const digit = createDigitElement(i);
    digitsElement.appendChild(digit);
  }
}

/** 선택된 타일 설정 */
function setSelectedTile(tile) {
  if (selectedTile) {
    selectedTile.classList.remove("selected");
  }
  selectedTile = tile;
  selectedTile.classList.add("selected");
}

// --- 게임 로직 함수 ---
/** 새 보드 생성 */
function createNewBoard(difficulty = "medium") {
  let isSuccess = false;
  while (!isSuccess) {
    board = createEmptyBoard();
    const newSolutionBoard = createEmptyBoard();
    isSuccess = fillBoardRandomly(newSolutionBoard);

    if (isSuccess) {
      solution = JSON.parse(JSON.stringify(newSolutionBoard));
      board = JSON.parse(JSON.stringify(newSolutionBoard));
      const numbersToRemove =
        DIFFICULTIES[difficulty.toUpperCase()] || DIFFICULTIES.MEDIUM;
      removeNumbers(numbersToRemove);
    }
  }
}

/** 연필 표시 토글 */
function togglePencilMark(tile, num) {
  let pencilMarks = tile.dataset.pencil.split(",").filter(Boolean);
  const index = pencilMarks.indexOf(num.toString());
  if (index > -1) pencilMarks.splice(index, 1);
  else pencilMarks.push(num.toString());
  tile.dataset.pencil = pencilMarks.join(",");
  tile.textContent = "";
  pencilMarks.forEach((mark) => {
    const span = document.createElement("span");
    span.classList.add("pencil-mark");
    span.textContent = mark;
    tile.appendChild(span);
  });
}

/** 관련 셀 강조 */
function highlightRelatedCells() {
  const cells = document.querySelectorAll(".tile");
  cells.forEach((cell) => cell.classList.remove("related"));

  if (
    selectedTile &&
    selectedTile.parentNode &&
    [...selectedTile.parentNode.children].includes(selectedTile)
  ) {
    const children = [...selectedTile.parentNode.children];
    const index = children.indexOf(selectedTile);
    if (index === -1) {
      console.error("selectedTile is not a child of its parent");
      return;
    }

    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;
    const boxStartRow = row - (row % BOX_SIZE);
    const boxStartCol = col - (col % BOX_SIZE);

    cells.forEach((cell, i) => {
      const cellRow = Math.floor(i / BOARD_SIZE);
      const cellCol = i % BOARD_SIZE;
      if (
        cellRow === row ||
        cellCol === col ||
        (cellRow >= boxStartRow &&
          cellRow < boxStartRow + BOX_SIZE &&
          cellCol >= boxStartCol &&
          cellCol < boxStartCol + BOX_SIZE)
      ) {
        cell.classList.add("related");
      }
    });
  }
}

/** 오류 강조 */
function highlightErrors() {
  const cells = document.querySelectorAll(".tile");
  cells.forEach((cell, index) => {
    cell.classList.remove("error");
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;
    const value = board[row][col];
    if (value !== INITIAL_BOARD_VALUE && !isValid(board, row, col, value)) {
      cell.classList.add("error");
    }
  });
}

// --- 이벤트 핸들러 ---

/** 타일 선택 */
function selectTile(tile, row, col) {
  if (selectedNumber !== null && board[row][col] === INITIAL_BOARD_VALUE) {
    history.push({ row, col, value: board[row][col] });
    if (isPencilMode) togglePencilMark(tile, selectedNumber);
    else {
      board[row][col] = selectedNumber;
      tile.textContent = selectedNumber;
      tile.dataset.pencil = "";
    }
    checkWin();
    highlightErrors();
  }
  setSelectedTile(tile);
  highlightRelatedCells();
}

/** 숫자 선택 */
function selectDigit(num) {
  selectedNumber = num;
  const digits = document.querySelectorAll(".digit");
  digits.forEach((digit) => digit.classList.remove("selected"));
  digits[num - 1].classList.add("selected");
}

/** 새 게임 시작 */
function startNewGame() {
  createNewBoard(currentDifficulty);
  renderBoard();
  renderDigits();
  history = [];
  selectedTile = null;
  selectedNumber = null;
}

/** 난이도 팝업 표시 */
function showDifficultyPopup() {
  difficultyPopup.style.display = "block";
}

/** 난이도 팝업 숨김 */
function hideDifficultyPopup() {
  difficultyPopup.style.display = "none";
}

// --- 이벤트 리스너 등록 ---
themeToggle.addEventListener("click", () =>
  document.body.classList.toggle("dark-mode")
);

newGameButton.addEventListener("click", showDifficultyPopup);

solveButton.addEventListener("click", () => {
  board = JSON.parse(JSON.stringify(solution));
  renderBoard();
});

undoButton.addEventListener("click", undo);

togglePencilButton.addEventListener("click", () => {
  isPencilMode = !isPencilMode;
  togglePencilButton.classList.toggle("active", isPencilMode);
});

// 난이도 팝업 이벤트 리스너
const difficultyButtons = difficultyPopup.querySelectorAll("button");
difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentDifficulty = button.dataset.difficulty;
    hideDifficultyPopup();
    startNewGame();
  });
});

// --- 초기화 ---
startNewGame();
