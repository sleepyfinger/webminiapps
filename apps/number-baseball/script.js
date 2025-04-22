let answer;
let currentGuess = "";
let attempts = 0;
let gameMode = 4; // 기본 모드는 4자리

const userGuessDisplay = document.getElementById("userGuess");
const numpad = document.getElementById("numpad");
const restartBtn = document.getElementById("restartBtn");
const result = document.getElementById("result");
const history = document.getElementById("history");

document.getElementById("mode3").onclick = () => setGameMode(3);
document.getElementById("mode4").onclick = () => setGameMode(4);

function setGameMode(mode) {
  gameMode = mode;
  initGame();
}

function generateRandomNumber() {
  const digits = [];
  while (digits.length < gameMode) {
    const randomDigit = Math.floor(Math.random() * 10);
    if (!digits.includes(randomDigit)) {
      digits.push(randomDigit);
    }
  }
  return digits.join("");
}

function initGame() {
  answer = generateRandomNumber();
  console.log("정답(디버깅용):", answer);
  currentGuess = "";
  attempts = 0;
  updateGuessDisplay();
  result.textContent = "";
  history.innerHTML = "";
  document.getElementById("clearBtn").disabled = false;
  document.getElementById("submitBtn").disabled = false;
  restartBtn.style.display = "none";
  userGuessDisplay.textContent = "_".repeat(gameMode);
}

function createNumpad() {
  numpad.innerHTML = "";
  for (let i = 1; i <= 9; i++) {
    createButton(i);
  }
  createButton("Clear", "clearBtn", clearGuess);
  createButton(0);
  createButton("Submit", "submitBtn", submitGuess);
}

function createButton(text, id, onClick) {
  const button = document.createElement("button");
  button.textContent = text;
  if (id) button.id = id;
  button.onclick = onClick || (() => addDigit(text));
  numpad.appendChild(button);
}

function addDigit(digit) {
  if (
    currentGuess.length < gameMode &&
    !currentGuess.includes(digit.toString())
  ) {
    currentGuess += digit;
    updateGuessDisplay();
  }
}

function clearGuess() {
  currentGuess = "";
  updateGuessDisplay();
}

function updateGuessDisplay() {
  userGuessDisplay.textContent = currentGuess.padEnd(gameMode, "_");
}

function calculateScore(userGuess, answer) {
  let strikes = 0,
    balls = 0;
  for (let i = 0; i < userGuess.length; i++) {
    if (userGuess[i] === answer[i]) {
      strikes++;
    } else if (answer.includes(userGuess[i])) {
      balls++;
    }
  }
  return { strikes, balls };
}

function submitGuess() {
  if (currentGuess.length !== gameMode) {
    result.textContent = `${gameMode}자리 숫자를 모두 입력하세요!`;
    return;
  }

  attempts++;
  const { strikes, balls } = calculateScore(currentGuess, answer);

  if (strikes === gameMode) {
    endGame();
  } else {
    updateHistory(strikes, balls);
    currentGuess = "";
    updateGuessDisplay();
  }
}

function endGame() {
  result.textContent = `축하합니다! ${attempts}번 만에 정답을 맞췄습니다! 🎉`;
  document.getElementById("submitBtn").disabled = true;
  document.getElementById("clearBtn").disabled = true;
  restartBtn.style.display = "inline-block";
}

function updateHistory(strikes, balls) {
  result.textContent = `${strikes} 스트라이크, ${balls} 볼`;
  const historyItem = document.createElement("li");
  historyItem.textContent = `${attempts}회차: ${currentGuess} - ${strikes}S ${balls}B`;
  history.insertBefore(historyItem, history.firstChild);
}

restartBtn.onclick = initGame;

document.getElementById("helpButton").addEventListener("click", function () {
  document.getElementById("helpPopup").style.display = "block";
});

function closeHelpPopup() {
  document.getElementById("helpPopup").style.display = "none";
}

createNumpad();
initGame();
