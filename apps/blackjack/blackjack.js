const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];
const INITIAL_MONEY = 1000;
const DEALER_HIT_THRESHOLD = 17;

const domElements = {
  playerCards: document.getElementById("player-cards"),
  dealerCards: document.getElementById("dealer-cards"),
  playerScore: document.getElementById("player-score"),
  dealerScore: document.getElementById("dealer-score"),
  playerMoney: document.getElementById("player-money"),
  resultMessage: document.getElementById("result-message"),
  hitButton: document.getElementById("hit-button"),
  standButton: document.getElementById("stand-button"),
  restartButton: document.getElementById("restart-button"),
  betInput: document.getElementById("bet-input"),
  betButton: document.getElementById("bet-button"),
  betButtons: document.getElementById("bet-buttons"),
  betArea: document.getElementById("bet-area"),
  betAmountButtons: document.querySelectorAll(".bet-amount"),
  newGameButton: document.getElementById("new-game-button"),
  resultContainer: document.getElementById("result-container"),
};

const gameState = {
  deck: [],
  playerCards: [],
  dealerCards: [],
  playerScore: 0,
  dealerScore: 0,
  gameEnded: false,
  playerMoney: INITIAL_MONEY,
  currentBet: 0,
};

function initializeDeck() {
  gameState.deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      gameState.deck.push({ suit, value });
    }
  }
}

function shuffleDeck() {
  for (let i = gameState.deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gameState.deck[i], gameState.deck[j]] = [
      gameState.deck[j],
      gameState.deck[i],
    ];
  }
}

function drawCard() {
  if (gameState.deck.length === 0) {
    initializeDeck();
    shuffleDeck();
  }
  return gameState.deck.pop();
}

function calculateScore(cards) {
  let score = 0;
  let aceCount = 0;
  for (const card of cards) {
    if (card.value === "A") {
      aceCount++;
      score += 11;
    } else if (["K", "Q", "J"].includes(card.value)) {
      score += 10;
    } else {
      score += parseInt(card.value);
    }
  }
  while (score > 21 && aceCount > 0) {
    score -= 10;
    aceCount--;
  }
  return score;
}

function displayCards(cards, element, hideFirstCard = false) {
  element.innerHTML = "";
  cards.forEach((card, index) => {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.textContent = `${card.value}${card.suit}`;
    if (hideFirstCard && index === 0) {
      cardDiv.textContent = "?";
      cardDiv.classList.add("hidden");
    }
    element.appendChild(cardDiv);
    setTimeout(() => {
      cardDiv.style.opacity = 1;
      cardDiv.style.position = "relative";
    }, index * 100);
  });
}

function updateMoneyDisplay() {
  domElements.playerMoney.textContent = gameState.playerMoney;
}

function updateScoreDisplay() {
  domElements.playerScore.textContent = gameState.playerScore;
  domElements.dealerScore.textContent = gameState.dealerScore;
}

function clearResultMessage() {
  domElements.resultMessage.textContent = "";
}

function showElement(element) {
  element.classList.remove("hidden");
}

function hideElement(element) {
  element.classList.add("hidden");
}

function initializeGame() {
  gameState.gameEnded = false;
  gameState.currentBet = 0;
  clearResultMessage();
  hideElement(domElements.hitButton);
  hideElement(domElements.standButton);
  hideElement(domElements.restartButton);
  hideElement(domElements.resultContainer);
  showElement(domElements.betButton);
  showElement(domElements.betButtons);
  showElement(domElements.betArea);
  initializeDeck();
  shuffleDeck();
  gameState.playerCards = [];
  gameState.dealerCards = [];
  gameState.playerScore = 0;
  gameState.dealerScore = 0;
  displayCards(gameState.playerCards, domElements.playerCards);
  displayCards(gameState.dealerCards, domElements.dealerCards, true);
  domElements.dealerScore.textContent = "?";
  updateScoreDisplay();
  updateMoneyDisplay();
  document.body.classList.remove("game-over");
  document.getElementById("game-container").classList.remove("game-over");
  domElements.betAmountButtons.forEach((btn) =>
    btn.classList.remove("selected")
  );
}

function endGame(message) {
  gameState.gameEnded = true;
  hideElement(domElements.hitButton);
  hideElement(domElements.standButton);
  hideElement(domElements.newGameButton);
  showElement(domElements.restartButton);
  showElement(domElements.resultContainer);
  hideElement(domElements.betButton);
  hideElement(domElements.betButtons);
  hideElement(domElements.betArea);
  domElements.resultMessage.textContent = message;
  gameState.dealerScore = calculateScore(gameState.dealerCards);
  updateScoreDisplay();
  displayCards(gameState.dealerCards, domElements.dealerCards);
  if (gameState.playerMoney <= 0) {
    domElements.resultMessage.textContent = "You ran out of money! Game Over!";
    hideElement(domElements.restartButton);
    showElement(domElements.newGameButton);
    showElement(domElements.resultContainer);
    document.body.classList.add("game-over");
    document.getElementById("game-container").classList.add("game-over");
  }
}

function playerHit() {
  if (gameState.gameEnded) return;
  gameState.playerCards.push(drawCard());
  gameState.playerScore = calculateScore(gameState.playerCards);
  displayCards(gameState.playerCards, domElements.playerCards);
  updateScoreDisplay();
  if (gameState.playerScore > 21) {
    gameState.playerMoney -= gameState.currentBet;
    updateMoneyDisplay();
    endGame("Player busts! Dealer wins!");
  }
}

function dealerTurn() {
  displayCards(gameState.dealerCards, domElements.dealerCards);
  gameState.dealerScore = calculateScore(gameState.dealerCards);
  updateScoreDisplay();
  while (gameState.dealerScore < DEALER_HIT_THRESHOLD) {
    gameState.dealerCards.push(drawCard());
    gameState.dealerScore = calculateScore(gameState.dealerCards);
    displayCards(gameState.dealerCards, domElements.dealerCards);
    updateScoreDisplay();
    if (gameState.dealerScore > 21) {
      gameState.playerMoney += gameState.currentBet;
      updateMoneyDisplay();
      endGame("Dealer busts! Player wins!");
      return;
    }
  }
  determineWinner();
}

function determineWinner() {
  if (gameState.dealerScore >= gameState.playerScore) {
    if (gameState.dealerScore === gameState.playerScore) {
      endGame("Push!");
    } else {
      gameState.playerMoney -= gameState.currentBet;
      updateMoneyDisplay();
      endGame("Dealer wins!");
    }
  } else {
    gameState.playerMoney += gameState.currentBet;
    updateMoneyDisplay();
    endGame("Player wins!");
  }
}

function playerStand() {
  if (gameState.gameEnded) return;
  dealerTurn();
}

function placeBet(betAmount) {
  if (isNaN(betAmount) || betAmount <= 0) {
    domElements.resultMessage.textContent = "Please enter a valid bet amount.";
    return;
  }
  if (betAmount > gameState.playerMoney) {
    domElements.resultMessage.textContent = "Insufficient funds.";
    return;
  }
  gameState.currentBet = betAmount;
  domElements.betInput.value = "";
  clearResultMessage();
  showElement(domElements.hitButton);
  showElement(domElements.standButton);
  hideElement(domElements.betButton);
  hideElement(domElements.betButtons);
  hideElement(domElements.betArea);
  gameState.playerCards.push(drawCard(), drawCard());
  gameState.dealerCards.push(drawCard(), drawCard());
  gameState.playerScore = calculateScore(gameState.playerCards);
  displayCards(gameState.playerCards, domElements.playerCards);
  displayCards(gameState.dealerCards, domElements.dealerCards, true);
  updateScoreDisplay();
}

domElements.hitButton.addEventListener("click", playerHit);
domElements.standButton.addEventListener("click", playerStand);
domElements.restartButton.addEventListener("click", () => {
  if (gameState.playerMoney > 0) {
    initializeGame();
  }
});

domElements.betButton.addEventListener("click", () => {
  const betAmount = parseInt(domElements.betInput.value);
  placeBet(betAmount);
});

domElements.betAmountButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const percentage = parseFloat(button.dataset.percentage);
    if (!isNaN(percentage)) {
      domElements.betInput.value = Math.floor(
        gameState.playerMoney * percentage
      );
    } else {
      domElements.betInput.value = gameState.playerMoney;
    }
    domElements.betAmountButtons.forEach((btn) =>
      btn.classList.remove("selected")
    );
    button.classList.add("selected");
  });
});

domElements.newGameButton.addEventListener("click", () => {
  gameState.playerMoney = INITIAL_MONEY;
  initializeGame();
});

function init() {
  updateMoneyDisplay();
  initializeGame();
}

init();
