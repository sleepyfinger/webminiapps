"use strict";

const gameBoardElement = document.getElementById("game-board");
const scoreElement = document.getElementById("score");
const resetButton = document.getElementById("reset-button");
const levelElement = document.getElementById("level");

const GRID_WIDTH = 6;
const GRID_HEIGHT = 8;

const BASE_CELL_SIZE = 55;
const BASE_BOARD_PADDING = 12;
const BASE_CELL_GAP = 4;

const ALL_FRUITS = ["🍎", "🍊", "🍋", "🍉", "🍇", "🍓", "🍒", "🥝"];

const SWAP_BACK_DELAY = 100;
const SWAP_ANIM_DURATION = 100;
const MATCH_ANIM_DURATION = 100;
const FALL_ANIM_DURATION = 200;
const FILL_ANIM_DURATION = 100;
const NEW_CELL_DELAY_MULTIPLIER = 25;

const SCORE_PER_LEVEL = 1000;
const FRUITS_PER_LEVEL = {
  1: 4,
  2: 4,
  3: 5,
  4: 6,
  5: 7,
  6: ALL_FRUITS.length,
};
let currentLevel = 1;

let board = [];
let score = 0;
let isProcessing = false;
let isDragging = false;
let dragStartCell = null;
let dragEndCell = null;
let dragStartX = 0;
let dragStartY = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const findElementByCoords = (r, c) =>
  gameBoardElement.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);

const getRandomFruit = () => {
  const levelKey = Math.min(currentLevel, Object.keys(FRUITS_PER_LEVEL).length);
  const maxFruitsForLevel = FRUITS_PER_LEVEL[levelKey];
  const allowedFruitCount = Math.min(maxFruitsForLevel, ALL_FRUITS.length);
  const availableFruits = ALL_FRUITS.slice(0, allowedFruitCount);
  return availableFruits[Math.floor(Math.random() * availableFruits.length)];
};

const createCellElement = (r, c, fruit) => {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.row = r;
  cell.dataset.col = c;
  cell.textContent = fruit;
  gameBoardElement.appendChild(cell);
  return cell;
};

const updateScore = () => {
  scoreElement.textContent = score;
  const scoreContainer = scoreElement.closest(".score-container");
  if (scoreContainer) {
    scoreContainer.style.transform = "scale(1.05)";
    setTimeout(() => {
      if (scoreContainer) scoreContainer.style.transform = "scale(1)";
    }, 150);
  }

  const targetLevel = Math.floor(score / SCORE_PER_LEVEL) + 1;

  if (targetLevel > currentLevel) {
    currentLevel = targetLevel;
    console.log(`Level Up! Reached Level ${currentLevel}`);

    if (levelElement) {
      levelElement.textContent = currentLevel;
      levelElement.style.transform = "scale(1.2)";
      setTimeout(() => {
        if (levelElement) levelElement.style.transform = "scale(1)";
      }, 200);
    }
  }
};

const clearAnimationClasses = () => {
  gameBoardElement.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("matched", "falling", "dragging", "drag-over");
    cell.style.transform = "";
    cell.style.opacity = "";
    cell.style.animation = "";
    cell.style.zIndex = "";
    cell.style.pointerEvents = "";
    cell.style.transition = "";
  });
};

const initializeBoardData = () => {
  board = [];
  for (let r = 0; r < GRID_HEIGHT; r++) {
    board[r] = [];
    for (let c = 0; c < GRID_WIDTH; c++) {
      board[r][c] = getRandomFruit();
    }
  }
};

const createBoardElements = () => {
  gameBoardElement.innerHTML = "";
  for (let r = 0; r < GRID_HEIGHT; r++) {
    for (let c = 0; c < GRID_WIDTH; c++) {
      createCellElement(r, c, "");
    }
  }
};

const updateBoardElements = () => {
  for (let r = 0; r < GRID_HEIGHT; r++) {
    for (let c = 0; c < GRID_WIDTH; c++) {
      const cellElement = findElementByCoords(r, c);
      if (cellElement) {
        cellElement.textContent = board[r][c];
      }
    }
  }
};

const checkForAllMatches = () => {
  const matchedCells = new Set();

  for (let r = 0; r < GRID_HEIGHT; r++) {
    for (let c = 0; c < GRID_WIDTH - 2; c++) {
      if (
        board[r][c] &&
        board[r][c] === board[r][c + 1] &&
        board[r][c] === board[r][c + 2]
      ) {
        let len = 3;
        while (c + len < GRID_WIDTH && board[r][c + len] === board[r][c]) {
          len++;
        }
        for (let i = 0; i < len; i++) matchedCells.add(`${r}-${c + i}`);
        c += len - 1;
      }
    }
  }

  for (let c = 0; c < GRID_WIDTH; c++) {
    for (let r = 0; r < GRID_HEIGHT - 2; r++) {
      if (
        board[r][c] &&
        board[r][c] === board[r + 1][c] &&
        board[r][c] === board[r + 2][c]
      ) {
        let len = 3;
        while (r + len < GRID_HEIGHT && board[r + len][c] === board[r][c]) {
          len++;
        }
        for (let i = 0; i < len; i++) matchedCells.add(`${r + i}-${c}`);
        r += len - 1;
      }
    }
  }

  return Array.from(matchedCells).map((coord) => {
    const [r, c] = coord.split("-").map(Number);
    return { r, c };
  });
};

const stabilizeBoard = () => {
  let matches = checkForAllMatches();
  let iterations = 0;
  const MAX_ITERATIONS = GRID_WIDTH * GRID_HEIGHT;

  while (matches.length > 0 && iterations < MAX_ITERATIONS) {
    matches.forEach(({ r, c }) => {
      const currentFruit = board[r][c];
      let newFruit;
      do {
        newFruit = getRandomFruit();
      } while (
        newFruit === currentFruit ||
        (c >= 2 &&
          board[r][c - 1] === newFruit &&
          board[r][c - 2] === newFruit) ||
        (r >= 2 && board[r - 1][c] === newFruit && board[r - 2][c] === newFruit)
      );
      board[r][c] = newFruit;
    });
    matches = checkForAllMatches();
    iterations++;
  }
  if (iterations >= MAX_ITERATIONS) {
    console.warn(
      "Stabilize board reached max iterations. Board might have initial matches."
    );
  }
};

const initGame = () => {
  score = 0;
  currentLevel = 1;
  updateScore();

  if (levelElement) {
    levelElement.textContent = currentLevel;
  }

  createBoardElements();
  initializeBoardData();
  stabilizeBoard();
  updateBoardElements();

  isProcessing = false;
  dragStartCell = null;
  dragEndCell = null;
};

const removeMatchedCells = async (matchedCoords) => {
  const removePromises = matchedCoords.map(({ r, c }) => {
    const cellElement = findElementByCoords(r, c);
    if (cellElement && board[r][c] !== null) {
      board[r][c] = null;
      cellElement.classList.add("matched");
    }
    return Promise.resolve();
  });
  await Promise.all(removePromises);
  await sleep(MATCH_ANIM_DURATION);
};

const dropFruits = async () => {
  const droppedCellsData = [];
  for (let c = 0; c < GRID_WIDTH; c++) {
    let emptyRow = GRID_HEIGHT - 1;
    for (let r = GRID_HEIGHT - 1; r >= 0; r--) {
      if (board[r][c] !== null) {
        if (r < emptyRow) {
          board[emptyRow][c] = board[r][c];
          board[r][c] = null;
          droppedCellsData.push({
            fromR: r,
            fromC: c,
            toR: emptyRow,
            toC: c,
            fruit: board[emptyRow][c],
          });
          emptyRow--;
        } else {
          emptyRow = r - 1;
        }
      }
    }
  }
  return droppedCellsData;
};

const animateFalling = async (droppedCellsData) => {
  const fallPromises = droppedCellsData.map(
    ({ fromR, fromC, toR, toC, fruit }) => {
      const targetElement = findElementByCoords(toR, toC);
      const fallingElement = findElementByCoords(fromR, fromC);

      if (targetElement) {
        targetElement.textContent = fruit;
        if (fallingElement) fallingElement.textContent = "";

        const fallDistance = (toR - fromR) * (BASE_CELL_SIZE + BASE_CELL_GAP);

        targetElement.style.transition = "none";
        targetElement.style.transform = `translateY(-${fallDistance}px)`;
        targetElement.classList.add("falling");
        targetElement.offsetHeight;
        targetElement.style.transition = `transform ${FALL_ANIM_DURATION}ms ease-in`;
        targetElement.style.transform = "translateY(0px)";

        return sleep(FALL_ANIM_DURATION);
      } else {
        console.warn(
          `Target element not found for falling fruit at ${toR}, ${toC}`
        );
        const targetElForce = findElementByCoords(toR, toC);
        if (targetElForce) targetElForce.textContent = fruit;
        if (fallingElement) fallingElement.textContent = "";
        return Promise.resolve();
      }
    }
  );
  await Promise.all(fallPromises);
};

const fillEmptyCells = async () => {
  const newCellsData = [];
  for (let c = 0; c < GRID_WIDTH; c++) {
    let filledCountInCol = 0;
    for (let r = 0; r < GRID_HEIGHT; r++) {
      if (board[r][c] === null) {
        const newFruit = getRandomFruit();
        board[r][c] = newFruit;
        newCellsData.push({
          r,
          c,
          fruit: newFruit,
          delay: filledCountInCol * NEW_CELL_DELAY_MULTIPLIER,
        });
        filledCountInCol++;
      }
    }
  }
  return newCellsData;
};

const animateAppearing = async (newCellsData) => {
  const appearPromises = newCellsData.map(({ r, c, fruit, delay }) => {
    const cellElement = findElementByCoords(r, c);
    if (cellElement) {
      return sleep(delay).then(async () => {
        cellElement.textContent = fruit;
        const startYOffset = (r + 1) * (BASE_CELL_SIZE + BASE_CELL_GAP);
        cellElement.style.opacity = "0";
        cellElement.style.transform = `translateY(-${startYOffset}px)`;
        cellElement.style.transition = "none";
        cellElement.offsetHeight;
        cellElement.style.transition = `transform ${FILL_ANIM_DURATION}ms ease-out, opacity ${
          FILL_ANIM_DURATION * 0.7
        }ms ease-in`;
        cellElement.style.opacity = "1";
        cellElement.style.transform = "translateY(0px)";
        await sleep(FILL_ANIM_DURATION);
      });
    }
    return Promise.resolve();
  });
  await Promise.all(appearPromises);
};

const handleMatches = async () => {
  let matches = checkForAllMatches();
  isProcessing = true;

  if (matches.length === 0) {
    isProcessing = false;
    return;
  }

  try {
    while (matches.length > 0) {
      score += matches.length * 10;
      updateScore();

      await removeMatchedCells(matches);
      const droppedCellsData = await dropFruits();
      await animateFalling(droppedCellsData);
      const newCellsData = await fillEmptyCells();
      await animateAppearing(newCellsData);
      clearAnimationClasses();
      matches = checkForAllMatches();
    }
  } catch (error) {
    console.error("Error during match handling cascade:", error);
    clearAnimationClasses();
  } finally {
    isProcessing = false;
    clearAnimationClasses();
  }
};

const visualSwap = async (cell1, cell2) => {
  const el1 = cell1.element;
  const el2 = cell2.element;
  if (!el1 || !el2) return;

  const rect1 = el1.getBoundingClientRect();
  const rect2 = el2.getBoundingClientRect();
  const deltaX = rect1.left - rect2.left;
  const deltaY = rect1.top - rect2.top;

  el1.style.transition = `transform ${SWAP_ANIM_DURATION}ms cubic-bezier(0.68, -0.55, 0.27, 1.55)`;
  el2.style.transition = `transform ${SWAP_ANIM_DURATION}ms cubic-bezier(0.68, -0.55, 0.27, 1.55)`;
  el1.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;
  el2.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

  await sleep(SWAP_ANIM_DURATION);

  el1.style.transform = "";
  el2.style.transform = "";
  el1.style.transition = "";
  el2.style.transition = "";
};

const swapAndCheck = async (cell1, cell2) => {
  let swapSuccess = false;

  try {
    isProcessing = true;
    await visualSwap(cell1, cell2);

    const tempFruit = board[cell1.row][cell1.col];
    board[cell1.row][cell1.col] = board[cell2.row][cell2.col];
    board[cell2.row][cell2.col] = tempFruit;

    if (cell1.element) cell1.element.textContent = board[cell1.row][cell1.col];
    if (cell2.element) cell2.element.textContent = board[cell2.row][cell2.col];

    const matchesFound = checkForAllMatches();

    if (matchesFound.length > 0) {
      swapSuccess = true;
      await handleMatches();
    } else {
      swapSuccess = false;
      await sleep(SWAP_BACK_DELAY);
      await visualSwap(cell1, cell2);

      board[cell2.row][cell2.col] = board[cell1.row][cell1.col];
      board[cell1.row][cell1.col] = tempFruit;

      if (cell1.element)
        cell1.element.textContent = board[cell1.row][cell1.col];
      if (cell2.element)
        cell2.element.textContent = board[cell2.row][cell2.col];

      isProcessing = false;
    }
  } catch (error) {
    console.error("Error during swap and check:", error);
    isProcessing = false;
    if (!swapSuccess && cell1 && cell2) {
      if (cell1.element)
        cell1.element.textContent = board[cell1.row][cell1.col];
      if (cell2.element)
        cell2.element.textContent = board[cell2.row][cell2.col];
    }
    clearAnimationClasses();
  } finally {
  }
};

const areAdjacent = (cell1, cell2) => {
  if (!cell1 || !cell2) return false;
  const rowDiff = Math.abs(cell1.row - cell2.row);
  const colDiff = Math.abs(cell1.col - cell2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
};

const handleDragStart = (event) => {
  if (isProcessing || (event.button && event.button !== 0)) return;
  const cellElement = event.target.closest(".cell");
  if (!cellElement) return;
  event.preventDefault();

  isDragging = true;
  const row = parseInt(cellElement.dataset.row);
  const col = parseInt(cellElement.dataset.col);
  dragStartCell = { row, col, element: cellElement };
  dragEndCell = null;

  const touch = event.touches ? event.touches[0] : event;
  dragStartX = touch.clientX;
  dragStartY = touch.clientY;

  cellElement.classList.add("dragging");
  cellElement.style.zIndex = "10";
  cellElement.style.pointerEvents = "none";

  document.addEventListener("mousemove", handleDragMove);
  document.addEventListener("touchmove", handleDragMove, { passive: false });
  document.addEventListener("mouseup", handleDragEnd);
  document.addEventListener("touchend", handleDragEnd);
};

const handleDragMove = (event) => {
  if (!isDragging || !dragStartCell) return;
  event.preventDefault();

  const touch = event.touches ? event.touches[0] : event;
  const clientX = touch.clientX;
  const clientY = touch.clientY;

  const deltaX = clientX - dragStartX;
  const deltaY = clientY - dragStartY;
  if (dragStartCell.element) {
    dragStartCell.element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
  }

  const boardRect = gameBoardElement.getBoundingClientRect();
  const boardX = clientX - boardRect.left - BASE_BOARD_PADDING;
  const boardY = clientY - boardRect.top - BASE_BOARD_PADDING;
  const totalCellWidth = BASE_CELL_SIZE + BASE_CELL_GAP;
  const totalCellHeight = BASE_CELL_SIZE + BASE_CELL_GAP;
  const targetCol = Math.floor(boardX / totalCellWidth);
  const targetRow = Math.floor(boardY / totalCellHeight);

  let potentialEndCell = null;
  if (
    targetRow >= 0 &&
    targetRow < GRID_HEIGHT &&
    targetCol >= 0 &&
    targetCol < GRID_WIDTH
  ) {
    if (targetRow !== dragStartCell.row || targetCol !== dragStartCell.col) {
      potentialEndCell = {
        row: targetRow,
        col: targetCol,
        element: findElementByCoords(targetRow, targetCol),
      };
    }
  }

  if (dragEndCell && dragEndCell.element) {
    dragEndCell.element.classList.remove("drag-over");
  }

  if (
    potentialEndCell &&
    potentialEndCell.element &&
    areAdjacent(dragStartCell, potentialEndCell)
  ) {
    dragEndCell = potentialEndCell;
    dragEndCell.element.classList.add("drag-over");
  } else {
    dragEndCell = null;
  }
};

const handleDragEnd = async () => {
  if (!isDragging || !dragStartCell) return;

  const elementToReset = dragStartCell.element;
  const currentDragStartCell = dragStartCell;
  const currentDragEndCell = dragEndCell;

  isDragging = false;
  dragStartCell = null;
  dragEndCell = null;

  try {
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("touchmove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
    document.removeEventListener("touchend", handleDragEnd);

    gameBoardElement
      .querySelectorAll(".drag-over")
      .forEach((el) => el.classList.remove("drag-over"));

    if (currentDragStartCell && currentDragEndCell) {
      if (elementToReset) {
        elementToReset.classList.remove("dragging");
        elementToReset.style.zIndex = "";
        elementToReset.style.pointerEvents = "";
        elementToReset.style.transform = "";
        elementToReset.style.transition = "";
      }
      await swapAndCheck(currentDragStartCell, currentDragEndCell);
    } else {
      if (elementToReset) {
        elementToReset.classList.remove("dragging");
        elementToReset.style.zIndex = "";
        elementToReset.style.transition = `transform ${SWAP_ANIM_DURATION}ms ease-out`;
        elementToReset.style.transform = "";
        await sleep(SWAP_ANIM_DURATION);
      }
      isProcessing = false;
    }
  } catch (error) {
    console.error("Error during drag end processing:", error);
    isProcessing = false;
    if (elementToReset) {
      elementToReset.style.transform = "";
      elementToReset.style.transition = "";
      elementToReset.classList.remove("dragging");
      elementToReset.style.zIndex = "";
      elementToReset.style.pointerEvents = "";
    }
  } finally {
    if (elementToReset) {
      elementToReset.style.transform = "";
      elementToReset.style.transition = "";
      elementToReset.classList.remove("dragging");
      elementToReset.style.zIndex = "";
      elementToReset.style.pointerEvents = "";
    }
  }
};

const resetGame = () => {
  if (isProcessing) return;
  isProcessing = true;

  clearAnimationClasses();
  isDragging = false;
  dragStartCell = null;
  dragEndCell = null;
  document.removeEventListener("mousemove", handleDragMove);
  document.removeEventListener("touchmove", handleDragMove);
  document.removeEventListener("mouseup", handleDragEnd);
  document.removeEventListener("touchend", handleDragEnd);

  initGame();
};

document.addEventListener("DOMContentLoaded", () => {
  gameBoardElement.addEventListener("mousedown", handleDragStart);
  gameBoardElement.addEventListener("touchstart", handleDragStart, {
    passive: false,
  });
  resetButton.addEventListener("click", resetGame);
  initGame();
});
