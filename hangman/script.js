import wordsWithHints from "./words.js";

const MAX_ATTEMPTS = 6;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

const dom = {
  word: document.getElementById("word"),
  hint: document.getElementById("hint"),
  message: document.getElementById("message"),
  keyboard: document.getElementById("keyboard"),
  hangmanStatus: document.getElementById("hangman-status"),
  restartButton: document.getElementById("restart-button"),
  hintButton: document.getElementById("hint-button"),
  themeCheckbox: document.getElementById("theme-checkbox"),
  body: document.body,
};

let gameState = {
  selectedWord: "",
  selectedHint: "",
  guessedLetters: [],
  attemptsLeft: MAX_ATTEMPTS,
};

async function searchImage(word) {
  const googleImageUrl = `https://www.google.com/search?q=${encodeURIComponent(
    word
  )}&tbm=isch`;

  return googleImageUrl;
}

async function openImageSearch(word) {
  const imageUrl = await searchImage(word);
  window.open(imageUrl, "_blank");
}

function getRandomWord() {
  const randomIndex = Math.floor(Math.random() * wordsWithHints.length);
  return wordsWithHints[randomIndex];
}

function updateHangmanStatus() {
  dom.hangmanStatus.textContent = `남은 기회: ${gameState.attemptsLeft}`;
}

function displayWord() {
  const display = gameState.selectedWord
    .split("")
    .map((letter) => (gameState.guessedLetters.includes(letter) ? letter : "_"))
    .join(" ");
  dom.word.textContent = display;

  dom.hint.removeEventListener("click", wordClickHandler);
  dom.hint.addEventListener("click", wordClickHandler);

  if (!display.includes("_")) {
    endGame("win");
  }
}

const wordClickHandler = (event) => {
  if (gameState.selectedWord) {
    openImageSearch(gameState.selectedWord);
  }
};

function disableKeyboard() {
  dom.keyboard
    .querySelectorAll("button")
    .forEach((button) => (button.disabled = true));
}

function showRestartButton() {
  dom.restartButton.classList.remove("hidden");
}

function updateMessage(text, type) {
  dom.message.textContent = text;
  dom.message.classList.remove("correct", "incorrect");
  dom.message.classList.add(type);
}

function createKeyboard() {
  dom.keyboard.innerHTML = "";
  ALPHABET.split("").forEach((letter) => {
    const button = document.createElement("button");
    button.textContent = letter.toUpperCase();
    button.dataset.letter = letter;
    button.addEventListener("click", () => handleGuess(letter, button));
    dom.keyboard.appendChild(button);
  });
}

function initializeGame() {
  const { word, hint } = getRandomWord();
  gameState = {
    selectedWord: word,
    selectedHint: hint,
    guessedLetters: [],
    attemptsLeft: MAX_ATTEMPTS,
  };

  dom.word.textContent = "";
  dom.hint.textContent = "";
  dom.message.textContent = "";
  dom.restartButton.classList.add("hidden");
  dom.hintButton.classList.remove("hidden");

  updateHangmanStatus();
  createKeyboard();
  displayWord();
}

function handleGuess(letter, button) {
  if (gameState.guessedLetters.includes(letter)) return;

  gameState.guessedLetters.push(letter);
  button.disabled = true;
  button.classList.add("used");

  if (!gameState.selectedWord.includes(letter)) {
    gameState.attemptsLeft--;
    updateHangmanStatus();
    updateMessage("틀렸습니다! ❌", "incorrect");
    button.classList.add("incorrect");

    if (gameState.attemptsLeft === 0) {
      endGame("lose");
    }
  } else {
    updateMessage("맞았습니다! ✅", "correct");
    button.classList.add("correct");
    displayWord();
  }
}

function endGame(result) {
  disableKeyboard();
  showRestartButton();

  if (result === "win") {
    updateMessage("축하합니다! 단어를 맞추셨습니다! 🎉", "correct");
  } else if (result === "lose") {
    updateMessage(
      `게임 오버! 😭 정답은 "${gameState.selectedWord}"였습니다.`,
      "incorrect"
    );
  }
}

dom.restartButton.addEventListener("click", initializeGame);

dom.hintButton.addEventListener("click", () => {
  if (gameState.selectedHint) {
    dom.hint.textContent = `힌트: ${gameState.selectedHint}`;
    dom.hintButton.classList.add("hidden");
  }
});

function setTheme(theme) {
  dom.body.classList.remove("dark-mode");
  if (theme === "dark-mode") {
    dom.body.classList.add("dark-mode");
  }
  localStorage.setItem("theme", theme);
}

function initializeTheme() {
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme) {
    setTheme(currentTheme);
    dom.themeCheckbox.checked = currentTheme === "dark-mode";
  }
}

dom.themeCheckbox.addEventListener("change", () => {
  setTheme(dom.themeCheckbox.checked ? "dark-mode" : "");
});

initializeTheme();
initializeGame();
