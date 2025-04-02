const wordsWithHints = [
  { word: "apple", hint: "A fruit that keeps the doctor away." },
  { word: "banana", hint: "A yellow fruit loved by monkeys." },
  { word: "orange", hint: "A citrus fruit and a color." },
  { word: "grape", hint: "Small purple or green fruits used to make wine." },
  { word: "lemon", hint: "A sour yellow citrus fruit." },
];

const maxAttempts = 6;

let selectedWord = "";
let selectedHint = "";
let guessedLetters = [];
let attemptsLeft = maxAttempts;

const wordElement = document.getElementById("word");
const hintElement = document.getElementById("hint");
const messageElement = document.getElementById("message");
const keyboardElement = document.getElementById("keyboard");
const hangmanStatusElement = document.getElementById("hangman-status");
const restartButton = document.getElementById("restart-button");
const hintButton = document.getElementById("hint-button");

function initializeGame() {
  const randomIndex = Math.floor(Math.random() * wordsWithHints.length);
  selectedWord = wordsWithHints[randomIndex].word;
  selectedHint = wordsWithHints[randomIndex].hint;

  guessedLetters = [];
  attemptsLeft = maxAttempts;

  wordElement.textContent = "";
  hintElement.textContent = "";
  messageElement.textContent = "";
  hangmanStatusElement.textContent = `남은 기회: ${attemptsLeft}`;
  keyboardElement.innerHTML = "";
  restartButton.classList.add("hidden");

  createKeyboard();
  displayWord();
}

function displayWord() {
  const display = selectedWord
    .split("")
    .map((letter) => (guessedLetters.includes(letter) ? letter : "_"))
    .join(" ");

  wordElement.textContent = display;

  if (!display.includes("_")) {
    messageElement.textContent = "축하합니다! 단어를 맞추셨습니다! 🎉";
    messageElement.classList.add("correct");
    messageElement.classList.remove("incorrect");
    disableKeyboard();
    showRestartButton();
  }
}

function handleGuess(letter, button) {
  if (guessedLetters.includes(letter)) return;

  guessedLetters.push(letter);

  if (button) {
    button.disabled = true;
    button.classList.add("used");
  }

  if (!selectedWord.includes(letter)) {
    attemptsLeft--;
    hangmanStatusElement.textContent = `남은 기회: ${attemptsLeft}`;
    messageElement.textContent = "틀렸습니다! ❌";
    messageElement.classList.add("incorrect");
    messageElement.classList.remove("correct");
    if (button) {
      button.classList.add("incorrect");
    }
    if (attemptsLeft === 0) {
      messageElement.textContent = `게임 오버! 😭 정답은 "${selectedWord}"였습니다.`;
      messageElement.classList.add("incorrect");
      messageElement.classList.remove("correct");
      disableKeyboard();
      showRestartButton();
      return;
    }
  } else {
    messageElement.textContent = "맞았습니다! ✅";
    messageElement.classList.add("correct");
    messageElement.classList.remove("incorrect");
    if (button) {
      button.classList.add("correct");
    }
  }

  displayWord();
}

function createKeyboard() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

  alphabet.forEach((letter) => {
    const button = document.createElement("button");
    button.textContent = letter.toUpperCase();
    button.dataset.letter = letter;
    button.addEventListener("click", () => {
      handleGuess(letter, button);
    });
    keyboardElement.appendChild(button);
  });
}

function disableKeyboard() {
  const buttons = keyboardElement.querySelectorAll("button");
  buttons.forEach((button) => (button.disabled = true));
}

function showRestartButton() {
  restartButton.classList.remove("hidden");
}

restartButton.addEventListener("click", initializeGame);

hintButton.addEventListener("click", () => {
  if (selectedHint) {
    hintElement.textContent = `힌트: ${selectedHint}`;
  }
});

initializeGame();
