// Constants
const BOARD_SIZE = 9;
const BOX_SIZE = 3;
const DIFFICULTIES = {
  EASY: 30,
  MEDIUM: 40,
  HARD: 50,
};

// Global Variables
let board = [];
let solution = [];
let selectedTile = null;
let history = [];
let isPencilMode = false;
let selectedNumber = null;
let currentDifficulty = "medium"; // Add to save current difficulty.

// DOM Elements
const boardElement = document.getElementById("board");
const digitsElement = document.getElementById("digits");
const newGameButton = document.getElementById("newGame");
const solveButton = document.getElementById("solve");
const undoButton = document.getElementById("undo");
const togglePencilButton = document.getElementById("togglePencil");
const themeToggle = document.getElementById("theme-toggle");
const difficultyPopup = document.getElementById("difficultyPopup");

// Event Listeners
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

newGameButton.addEventListener("click", () => {
  // Show the difficulty selection popup
  showDifficultyPopup();
});

solveButton.addEventListener("click", () => {
  solveSudoku(board);
  renderBoard();
});
undoButton.addEventListener("click", undo);
togglePencilButton.addEventListener("click", () => {
  isPencilMode = !isPencilMode;
  togglePencilButton.classList.toggle("active", isPencilMode);
});

// --- Core Game Logic ---

function generateBoard(difficulty = "medium") {
  board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));

  // Generate a fully solved board
  let tempBoard = JSON.parse(JSON.stringify(board));
  solveSudoku(tempBoard);
  solution = JSON.parse(JSON.stringify(tempBoard));

  board = JSON.parse(JSON.stringify(tempBoard)); // make board same as tempBoard

  const numbersToRemove =
    DIFFICULTIES[difficulty.toUpperCase()] || DIFFICULTIES.MEDIUM;

  removeNumbersFromBoard(numbersToRemove);
}

function removeNumbersFromBoard(numbersToRemove) {
  let removedCount = 0;
  let possibleIndexes = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] !== 0) {
        possibleIndexes.push({ row, col });
      }
    }
  }

  while (removedCount < numbersToRemove && possibleIndexes.length > 0) {
    const randomIndex = Math.floor(Math.random() * possibleIndexes.length);
    const { row, col } = possibleIndexes[randomIndex];

    // Remove number from board and possibleIndexes
    board[row][col] = 0;
    possibleIndexes.splice(randomIndex, 1);
    removedCount++;
  }
}

function solveSudoku(board) {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= BOARD_SIZE; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) {
              return true;
            } else {
              board[row][col] = 0;
            }
          }
        }
        return false;
      }
    }
  }
  return true;
}

function isValid(board, row, col, num) {
  return (
    !isInRow(board, row, num) &&
    !isInCol(board, col, num) &&
    !isInBox(board, row, col, num)
  );
}

function isInRow(board, row, num) {
  return board[row].includes(num);
}

function isInCol(board, col, num) {
  return board.some((row) => row[col] === num);
}

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

// --- Rendering & UI ---

function renderBoard() {
  boardElement.innerHTML = "";
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      const tile = createTile(i, j);
      boardElement.appendChild(tile);
    }
  }
  highlightRelatedCells();
}

function createTile(row, col) {
  const tile = document.createElement("div");
  tile.classList.add("tile");
  if (board[row][col] !== 0) {
    tile.textContent = board[row][col];
    tile.classList.add("given"); // Add given numbers
  } else {
    tile.dataset.pencil = "";
  }
  tile.addEventListener("click", () => selectTile(tile, row, col));
  return tile;
}

function renderDigits() {
  digitsElement.innerHTML = "";
  for (let i = 1; i <= BOARD_SIZE; i++) {
    const digit = createDigit(i);
    digitsElement.appendChild(digit);
  }
}

function createDigit(num) {
  const digit = document.createElement("button");
  digit.classList.add("digit");
  digit.textContent = num;
  digit.addEventListener("click", () => selectDigit(num));
  return digit;
}

function selectTile(tile, row, col) {
  if (selectedNumber !== null && board[row][col] === 0) {
    history.push({ row, col, value: board[row][col] });
    if (isPencilMode) {
      togglePencilMark(tile, selectedNumber);
    } else {
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

function setSelectedTile(tile) {
  if (selectedTile) {
    selectedTile.classList.remove("selected");
  }
  selectedTile = tile;
  selectedTile.classList.add("selected");
}

function selectDigit(num) {
  selectedNumber = num;
  const digits = document.querySelectorAll(".digit");
  digits.forEach((digit) => digit.classList.remove("selected"));
  digits[num - 1].classList.add("selected");
}

function togglePencilMark(tile, num) {
  let pencilMarks = tile.dataset.pencil.split(",").filter(Boolean);
  const index = pencilMarks.indexOf(num.toString());
  if (index > -1) {
    pencilMarks.splice(index, 1);
  } else {
    pencilMarks.push(num.toString());
  }
  tile.dataset.pencil = pencilMarks.join(",");
  tile.textContent = "";
  pencilMarks.forEach((mark) => {
    const span = document.createElement("span");
    span.classList.add("pencil-mark");
    span.textContent = mark;
    tile.appendChild(span);
  });
}

function highlightRelatedCells() {
  const cells = document.querySelectorAll(".tile");
  cells.forEach((cell) => cell.classList.remove("related"));
  if (selectedTile) {
    const index = [...selectedTile.parentNode.children].indexOf(selectedTile);
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

function highlightErrors() {
  const cells = document.querySelectorAll(".tile");
  cells.forEach((cell, index) => {
    cell.classList.remove("error");
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;
    const value = board[row][col];
    if (value !== 0 && !isValid(board, row, col, value)) {
      cell.classList.add("error");
    }
  });
}

// --- Game Control ---

function undo() {
  if (history.length > 0) {
    const lastMove = history.pop();
    board[lastMove.row][lastMove.col] = lastMove.value;
    renderBoard();
  }
}

function checkWin() {
  if (JSON.stringify(board) === JSON.stringify(solution)) {
    alert("축하합니다! 스도쿠를 완성했습니다!");
  }
}

// --- Difficulty Popup Functions ---

function showDifficultyPopup() {
  difficultyPopup.style.display = "block";
}

function hideDifficultyPopup() {
  difficultyPopup.style.display = "none";
}

// --- Initialization ---

function initGame() {
  generateBoard(currentDifficulty);
  renderBoard();
  renderDigits();
  history = [];
  selectedTile = null;
  selectedNumber = null;
}

initGame();

// **Difficulty Popup Event Listeners**
const difficultyButtons = difficultyPopup.querySelectorAll("button");
difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentDifficulty = button.dataset.difficulty;
    hideDifficultyPopup();
    initGame();
  });
});
