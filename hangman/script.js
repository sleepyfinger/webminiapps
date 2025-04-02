const wordsWithHints = [
  { word: "apple", hint: "A fruit that keeps the doctor away." },
  { word: "banana", hint: "A yellow fruit loved by monkeys." },
  { word: "orange", hint: "A citrus fruit and a color." },
  { word: "grape", hint: "Small purple or green fruits used to make wine." },
  { word: "lemon", hint: "A sour yellow citrus fruit." },
  { word: "strawberry", hint: "A red, sweet, and juicy berry." },
  { word: "blueberry", hint: "A small, round, blue-colored berry." },
  { word: "raspberry", hint: "A red or black berry with a delicate flavor." },
  { word: "watermelon", hint: "A large, green fruit with red, juicy flesh." },
  { word: "pineapple", hint: "A tropical fruit with a tough, spiky skin." },
  { word: "mango", hint: "A sweet, tropical fruit with a large seed." },
  {
    word: "kiwi",
    hint: "A small, brown fruit with green flesh and tiny black seeds.",
  },
  { word: "peach", hint: "A soft, fuzzy fruit with a large pit." },
  { word: "pear", hint: "A bell-shaped fruit that is often green or yellow." },
  { word: "cherry", hint: "A small, round, red fruit with a pit." },
  { word: "apricot", hint: "A small, orange fruit similar to a peach." },
  {
    word: "plum",
    hint: "A sweet, juicy fruit that can be purple, red, or yellow.",
  },
  { word: "avocado", hint: "A creamy, green fruit often used in guacamole." },
  { word: "pomegranate", hint: "A fruit with many small, juicy seeds inside." },
  { word: "lime", hint: "A small, green citrus fruit, similar to a lemon." },
  {
    word: "coconut",
    hint: "A large, hard-shelled fruit with white flesh and liquid inside.",
  },
  { word: "fig", hint: "A soft, sweet fruit with many small seeds." },
  { word: "melon", hint: "A large, sweet fruit with a smooth rind." },
  {
    word: "papaya",
    hint: "A tropical fruit with orange flesh and black seeds.",
  },
  { word: "guava", hint: "A tropical fruit with a sweet, fragrant flesh." },
  { word: "cranberry", hint: "A small, tart, red berry." },
  { word: "blackberry", hint: "A dark, sweet berry with many small seeds." },
  {
    word: "cantaloupe",
    hint: "A type of melon with orange flesh and a netted rind.",
  },
  {
    word: "honeydew",
    hint: "A type of melon with pale green flesh and a smooth rind.",
  },
  {
    word: "tangerine",
    hint: "A small, sweet citrus fruit, similar to an orange.",
  },
  {
    word: "grapefruit",
    hint: "A large, citrus fruit with a tart, juicy flesh.",
  },
  { word: "nectarine", hint: "A smooth-skinned fruit similar to a peach." },
  {
    word: "persimmon",
    hint: "A sweet, orange fruit that can be eaten fresh or dried.",
  },
  { word: "quince", hint: "A hard, yellow fruit that is often cooked." },
  { word: "date", hint: "A sweet, chewy fruit that grows on palm trees." },
  {
    word: "elderberry",
    hint: "A small, dark berry often used in jams and wines.",
  },
  { word: "gooseberry", hint: "A tart, green berry often used in pies." },
  { word: "mulberry", hint: "A sweet, dark berry that grows on trees." },
  {
    word: "passionfruit",
    hint: "A tropical fruit with a juicy, seedy interior.",
  },
  {
    word: "dragonfruit",
    hint: "A tropical fruit with bright pink skin and white or red flesh.",
  },
  { word: "starfruit", hint: "A yellow fruit with a star shape when sliced." },
  { word: "limequat", hint: "A cross between a lime and a kumquat." },
  {
    word: "kumquat",
    hint: "A small, orange citrus fruit with an edible peel.",
  },
  { word: "lychee", hint: "A small, sweet fruit with a rough, red shell." },
  { word: "rambutan", hint: "A tropical fruit with a hairy red shell." },
  { word: "durian", hint: "A large, spiky fruit with a strong odor." },
  { word: "breadfruit", hint: "A large, starchy fruit that is often cooked." },
  {
    word: "plantain",
    hint: "A starchy fruit similar to a banana, often cooked.",
  },
  {
    word: "jackfruit",
    hint: "A large, tropical fruit with a sweet, yellow flesh.",
  },
  { word: "guinep", hint: "A small, green fruit with a sweet, juicy flesh." },
  { word: "carambola", hint: "Another name for starfruit." },
  { word: "yuzu", hint: "A Japanese citrus fruit with a tart flavor." },
  { word: "ugli", hint: "A hybrid citrus fruit with a wrinkled skin." },
  { word: "pomelo", hint: "A large, citrus fruit with a thick rind." },
  {
    word: "mandarin",
    hint: "A small, sweet citrus fruit, similar to a tangerine.",
  },
  { word: "clementine", hint: "A small, seedless citrus fruit." },
  { word: "bloodorange", hint: "A citrus fruit with dark red flesh." },
  {
    word: "tangelo",
    hint: "A hybrid citrus fruit, a cross between a tangerine and a pomelo.",
  },
  {
    word: "boysenberry",
    hint: "A cross between a raspberry, blackberry, and loganberry.",
  },
  { word: "loganberry", hint: "A cross between a raspberry and a blackberry." },
  {
    word: "cloudberry",
    hint: "A golden-colored berry that grows in cold climates.",
  },
  { word: "salmonberry", hint: "A berry that can be red, orange, or yellow." },
  { word: "lingonberry", hint: "A small, red berry that is tart and sweet." },
  {
    word: "currant",
    hint: "A small, round berry that can be red, black, or white.",
  },
  { word: "juniperberry", hint: "A berry used to flavor gin." },
  { word: "acai", hint: "A dark purple berry from South America." },
  { word: "acerola", hint: "A cherry-like fruit that is high in vitamin C." },
  {
    word: "feijoa",
    hint: "A green, egg-shaped fruit with a sweet, aromatic flavor.",
  },
  { word: "miracleberry", hint: "A berry that makes sour foods taste sweet." },
  { word: "goji", hint: "A small, red berry that is high in antioxidants." },
  { word: "wolfberry", hint: "Another name for goji berry." },
  { word: "huckleberry", hint: "A small, dark berry that grows in the wild." },
  { word: "serviceberry", hint: "A small, sweet berry that grows on a shrub." },
  { word: "buffaloberry", hint: "A small, red berry that is tart and bitter." },
  { word: "sea buckthorn", hint: "An orange berry that is high in vitamins." },
  {
    word: "soursop",
    hint: "A tropical fruit with a creamy, sweet-sour flesh.",
  },
  {
    word: "cherimoya",
    hint: "A tropical fruit with a sweet, custard-like flesh.",
  },
  { word: "custardapple", hint: "Another name for cherimoya." },
  { word: "sapodilla", hint: "A tropical fruit with a sweet, grainy flesh." },
  { word: "mamey", hint: "A tropical fruit with a sweet, orange-red flesh." },
  {
    word: "canistel",
    hint: "A yellow fruit with a sweet, custard-like flesh.",
  },
  {
    word: "santol",
    hint: "A tropical fruit with a sweet-sour, cottony flesh.",
  },
  {
    word: "mangosteen",
    hint: "A tropical fruit with a sweet, white, segmented flesh.",
  },
  { word: "salak", hint: "A tropical fruit with a scaly, brown skin." },
  {
    word: "longan",
    hint: "A small, round fruit with a sweet, translucent flesh.",
  },
  {
    word: "pulasan",
    hint: "A tropical fruit similar to rambutan, but with shorter spines.",
  },
  { word: "cupuacu", hint: "A tropical fruit with a creamy, tangy flesh." },
  {
    word: "jabuticaba",
    hint: "A fruit that grows directly on the trunk of the tree.",
  },
  { word: "miraclefruit", hint: "Another name for miracle berry." },
  {
    word: "cloudberry",
    hint: "A golden-colored berry that grows in cold climates.",
  },
  {
    word: "bilberry",
    hint: "A small, dark blue berry similar to a blueberry.",
  },
  { word: "dewberry", hint: "A dark, sweet berry similar to a blackberry." },
  {
    word: "elderberry",
    hint: "A small, dark berry often used in jams and wines.",
  },
  { word: "gooseberry", hint: "A tart, green berry often used in pies." },
  { word: "mulberry", hint: "A sweet, dark berry that grows on trees." },
  {
    word: "jujube",
    hint: "A small, sweet fruit that can be eaten fresh or dried.",
  },
  {
    word: "persimmon",
    hint: "A sweet, orange fruit that can be eaten fresh or dried.",
  },
  { word: "medlar", hint: "A brown fruit that is eaten when it is overripe." },
  {
    word: "pawpaw",
    hint: "A tropical fruit with a sweet, custard-like flesh.",
  },
  { word: "quince", hint: "A hard, yellow fruit that is often cooked." },
  { word: "tamarind", hint: "A sour, brown fruit used in many cuisines." },
  { word: "breadnut", hint: "A starchy fruit similar to breadfruit." },
];

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

  if (!display.includes("_")) {
    endGame("win");
  }
}

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
