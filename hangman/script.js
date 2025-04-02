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

function createTooltip(imageUrl) {
  const tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.backgroundColor = "white";
  tooltip.style.border = "1px solid black";
  tooltip.style.padding = "5px";
  tooltip.style.zIndex = "10";
  tooltip.style.display = "none";
  tooltip.style.maxWidth = "200px";
  tooltip.style.maxHeight = "200px";
  tooltip.style.overflow = "hidden";
  tooltip.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";

  const image = document.createElement("img");
  image.src = imageUrl;
  image.style.width = "100%";
  image.style.height = "auto";
  image.style.objectFit = "cover";
  tooltip.appendChild(image);

  return tooltip;
}

async function searchImage(word) {
  const apiKey = "";
  const searchEngineId = "";
  const googleSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${word}&searchType=image&num=1`;
  const defaultImageUrl = "https://via.placeholder.com/200x200?text=No+Image";

  if (!apiKey || !searchEngineId) {
    const googleImageUrl = `https://www.google.com/search?q=${encodeURIComponent(
      word
    )}&tbm=isch`;
    return googleImageUrl;
  }

  try {
    const response = await fetch(googleSearchUrl);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0].link;
    } else {
      return defaultImageUrl;
    }
  } catch (error) {
    console.error("Error fetching image:", error);
    return defaultImageUrl;
  }
}

async function showImageTooltip(event, word) {
  const imageUrl = await searchImage(word);
  if (
    typeof imageUrl === "string" &&
    imageUrl.startsWith("https://www.google.com/search?")
  ) {
    window.open(imageUrl, "_blank");
    return;
  }

  const tooltip = createTooltip(imageUrl);
  document.body.appendChild(tooltip);

  tooltip.style.left = `${event.pageX + 10}px`;
  tooltip.style.top = `${event.pageY + 10}px`;
  tooltip.style.display = "block";

  const hideTooltip = (e) => {
    if (!tooltip.contains(e.target)) {
      tooltip.style.display = "none";
      document.body.removeChild(tooltip);
      document.removeEventListener("mousemove", hideTooltip);
    }
  };
  document.addEventListener("mousemove", hideTooltip);
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
    showImageTooltip(event, gameState.selectedWord);
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
