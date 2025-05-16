let communityCards = [];
let gameState = "waiting";
let pot = 0;
let currentBet = 0;
let minRaiseAmount = 0;
let players = [];
let deck = [];
let currentPlayerIndex = 0;
let dealerButtonIndex = 0;
let smallBlindAmount = 10;
let bigBlindAmount = 20;
let actionsLog = [];
let persistentStacks = {};
let isUserGameOver = false;
const INITIAL_STACK = 1000;

function saveStacksToLocalStorage() {
  localStorage.setItem("texasHoldemStacks", JSON.stringify(persistentStacks));
}

function loadStacksFromLocalStorage() {
  const savedStacks = localStorage.getItem("texasHoldemStacks");
  if (savedStacks) {
    persistentStacks = JSON.parse(savedStacks);
  }
}

function updateStartButtonState() {
  document.getElementById("startGameBtn").disabled = !(
    gameState === "waiting" || gameState === "showdown"
  );
}

const CARD_VALUES_MAP = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const HAND_RANKS = {
  HIGH_CARD: 0,
  ONE_PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
};

function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const values = [
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
  deck = [];
  for (let s of suits) for (let v of values) deck.push(v + s);
  deck.sort(() => Math.random() - 0.5);
}

function updateAiCountDisplay(count) {
  document.getElementById("aiCountDisplay").textContent = count;
}

function setAiCountFromSlider(count) {
  document.getElementById("aiCount").value = count;
  updateAiCountDisplay(count);
}

function startGame(isNewGame = true) {
  // isNewGame 파라미터 추가, 기본값은 true (새 게임 시작)
  const aiCount = parseInt(document.getElementById("aiCount").value);
  if (isNaN(aiCount) || aiCount < 1 || aiCount > 9) {
    alert("AI 플레이어 수는 1~9 사이여야 합니다.");
    return;
  }

  if (isUserGameOver) {
    persistentStacks["User"] = INITIAL_STACK; // 사용자 스택은 게임 오버 시 항상 초기화
    saveStacksToLocalStorage();
    isUserGameOver = false;
    logAction("게임 오버! User님의 스택이 초기화되어 새 게임을 시작합니다.");
  }
  // isNewGame이 true일 때만 사용자 스택을 초기화 조건에 따라 설정 (게임 오버가 아닌 첫 시작, 또는 스택 0인데 게임오버 상태가 아니었던 경우)
  if (
    isNewGame &&
    (persistentStacks["User"] === undefined ||
      (persistentStacks["User"] <= 0 && !isUserGameOver))
  ) {
    persistentStacks["User"] = INITIAL_STACK;
  }

  players = [
    {
      name: "User",
      isAI: false,
      cards: [],
      stack: persistentStacks["User"],
      currentBetInRound: 0,
      status: "active",
      hasActedThisRound: false,
    },
  ];
  for (let i = 1; i <= aiCount; i++) {
    players.push({
      name: "AI_" + i,
      isAI: true,
      cards: [],
      stack:
        isNewGame ||
        !persistentStacks["AI_" + i] ||
        persistentStacks["AI_" + i] <= 0
          ? INITIAL_STACK
          : persistentStacks["AI_" + i],
      currentBetInRound: 0,
      status: "active",
      hasActedThisRound: false,
    });
  }

  const currentAiPlayerNames = players.filter((p) => p.isAI).map((p) => p.name);
  for (const playerName in persistentStacks) {
    if (
      playerName.startsWith("AI_") &&
      !currentAiPlayerNames.includes(playerName)
    ) {
      delete persistentStacks[playerName];
    }
  }
  players.forEach((p) => {
    if (p.isAI) {
      if (isNewGame) {
        persistentStacks[p.name] = INITIAL_STACK;
      } else {
        persistentStacks[p.name] = p.stack;
      }
    } else if (
      persistentStacks[p.name] === undefined ||
      (p.name === "User" &&
        persistentStacks[p.name] <= 0 &&
        !isUserGameOver &&
        isNewGame)
    ) {
      persistentStacks[p.name] = p.stack;
    }
  });
  saveStacksToLocalStorage();

  communityCards = [];
  pot = 0;
  actionsLog = [];
  logAction("새 게임을 시작합니다.");

  dealerButtonIndex = (dealerButtonIndex + 1) % players.length;

  createDeck();
  dealPlayerCards();

  gameState = "preflop";
  postBlinds();

  currentPlayerIndex = (dealerButtonIndex + 3) % players.length;
  if (players.length === 2) {
    currentPlayerIndex = dealerButtonIndex;
  }

  resetRoundState();
  players.forEach((p) => (p.hasActedThisRound = false));

  renderAll();
  setupUserActionButtons();
  updateActionButtons();

  logAction(`--- ${gameState.toUpperCase()} 라운드 시작 ---`);
  logAction(`딜러: ${players[dealerButtonIndex].name}`);
  processTurn();
}

function dealPlayerCards() {
  for (let p of players) {
    if (deck.length > 1) {
      p.cards = [deck.pop(), deck.pop()];
    } else {
      logAction("덱에 카드가 부족합니다!", "error");
    }
  }
}

function postBlinds() {
  const sbPlayerIndex = (dealerButtonIndex + 1) % players.length;
  const bbPlayerIndex = (dealerButtonIndex + 2) % players.length;

  if (players.length === 2) {
    forceBet(players[dealerButtonIndex], smallBlindAmount, "스몰 블라인드");
    forceBet(
      players[(dealerButtonIndex + 1) % players.length],
      bigBlindAmount,
      "빅 블라인드"
    );
    currentBet = bigBlindAmount;
    minRaiseAmount = bigBlindAmount * 2;
  } else {
    if (players[sbPlayerIndex]) {
      forceBet(players[sbPlayerIndex], smallBlindAmount, "스몰 블라인드");
    }
    if (players[bbPlayerIndex]) {
      forceBet(players[bbPlayerIndex], bigBlindAmount, "빅 블라인드");
    }
    currentBet = bigBlindAmount;
    minRaiseAmount = bigBlindAmount * 2;
  }
}

function forceBet(player, amount, type) {
  const bet = Math.min(player.stack, amount);
  player.stack -= bet;
  player.currentBetInRound += bet;
  pot += bet;
  logAction(`${player.name}: ${type} ${bet}원 베팅.`);
  if (player.stack === 0) {
    player.status = "allin";
    logAction(`${player.name} 올인!`);
  }
}

function resetRoundState() {
  players.forEach((p) => {
    p.currentBetInRound = 0;
    if (p.status !== "folded" && p.stack > 0) p.status = "active";
    p.hasActedThisRound = false;
  });
  currentBet = 0;
  minRaiseAmount = bigBlindAmount;
}

function processTurn() {
  renderAll();
  if (checkRoundEnd()) {
    endBettingRound();
    return;
  }

  let player = players[currentPlayerIndex];
  let initialPlayerIndexForLoopCheck = currentPlayerIndex;
  let loopedOnceThroughAllPlayers = false;

  while (player.status === "folded" || player.status === "allin") {
    if (player.status === "allin" && !player.hasActedThisRound) {
      logAction(`${player.name} is all-in, action passes.`);
      player.hasActedThisRound = true;
    }

    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    player = players[currentPlayerIndex];

    if (currentPlayerIndex === initialPlayerIndexForLoopCheck) {
      if (loopedOnceThroughAllPlayers) {
        logAction(
          "All remaining players are folded or all-in. Ending round.",
          "info"
        );
        endBettingRound();
        return;
      }
      loopedOnceThroughAllPlayers = true;
    }

    if (checkRoundEnd()) {
      endBettingRound();
      return;
    }
  }
  const activePlayersStillToBet = players.filter(
    (p) => p.status === "active" && p.stack > 0
  );
  if (
    activePlayersStillToBet.length === 0 &&
    players.filter((p) => p.status !== "folded").length > 1
  ) {
    if (checkAllBetsEqualOrAllin()) {
      endBettingRound();
      return;
    }
  }

  updateActionButtons();

  if (player.isAI) {
    setTimeout(() => aiTakeAction(player), 1000);
  } else {
    logAction(`${player.name}의 차례입니다. (스택: ${player.stack}원)`);
  }
}

function checkAllBetsEqualOrAllin() {
  const activePlayers = players.filter((p) => p.status !== "folded");
  if (activePlayers.length <= 1) return true;

  return activePlayers.every(
    (p) =>
      p.currentBetInRound === currentBet ||
      (p.status === "allin" && p.currentBetInRound <= currentBet)
  );
}

function checkRoundEnd() {
  const activePlayers = players.filter((p) => p.status !== "folded");
  if (activePlayers.length <= 1) {
    logAction("한 명의 플레이어만 남았습니다.");
    return true;
  }

  const allActed = activePlayers.every((p) => p.hasActedThisRound);
  if (!allActed) return false;

  const allBetsEqual = activePlayers.every(
    (p) => p.currentBetInRound === currentBet || p.status === "allin"
  );

  if (allActed && allBetsEqual) {
    logAction("모든 플레이어 액션 완료 및 베팅 일치.");
    return true;
  }
  return false;
}

function endBettingRound() {
  logAction(`--- ${gameState.toUpperCase()} 라운드 베팅 종료 ---`);

  if (gameState === "preflop") {
    gameState = "flop";
    dealCommunityCards(3, "플랍");
  } else if (gameState === "flop") {
    gameState = "turn";
    dealCommunityCards(1, "턴");
  } else if (gameState === "turn") {
    gameState = "river";
    dealCommunityCards(1, "리버");
  } else if (gameState === "river") {
    gameState = "showdown";
    showdown();
    return;
  } else {
    logAction("알 수 없는 게임 상태!", "error");
    return;
  }

  if (players.filter((p) => p.status !== "folded").length <= 1) {
    showdown();
    return;
  }

  resetRoundState();
  currentPlayerIndex = (dealerButtonIndex + 1) % players.length;
  if (players.length === 2) {
    currentPlayerIndex = dealerButtonIndex;
  }

  logAction(`--- ${gameState.toUpperCase()} 라운드 시작 ---`);
  renderAll();
  processTurn();
}

function dealCommunityCards(count, stageName) {
  logAction(`--- ${stageName} 카드 공개 ---`);
  for (let i = 0; i < count; i++) {
    if (deck.length > 0) {
      communityCards.push(deck.pop());
    }
  }
}

function showdown() {
  logAction("--- 쇼다운 ---");
  gameState = "showdown";

  const contenders = players.filter((p) => p.status !== "folded");

  if (contenders.length === 0) {
    logAction("남아있는 플레이어가 없어 팟을 분배할 수 없습니다.");
    pot = 0;
    renderAll();
    document.getElementById("user-action-controls").innerHTML =
      '<button onclick="startGame()">다음 핸드 시작</button>';
    return;
  }

  if (contenders.length === 1) {
    logAction(
      `${contenders[0].name}님이 팟 ${pot}원을 가져갑니다! (다른 플레이어 폴드)`
    );
    contenders[0].stack += pot;
    const handEval = evaluateBestHand(contenders[0].cards, communityCards);
    if (handEval) {
      logAction(
        `${contenders[0].name}의 핸드: ${
          handEval.handName
        } (${handEval.bestCards.join(", ")})`
      );
    }
  } else {
    players.forEach((p) => {
      persistentStacks[p.name] = p.stack;
    });

    logAction("--- 핸드 평가 ---");
    let playerEvals = [];
    contenders.forEach((player) => {
      const handEvaluation = evaluateBestHand(player.cards, communityCards);
      if (handEvaluation) {
        playerEvals.push({ player, evaluation: handEvaluation });
        logAction(
          `${player.name}: ${
            handEvaluation.handName
          } (${handEvaluation.bestCards.join(", ")})`
        );
      } else {
        logAction(`${player.name}: 핸드를 평가할 수 없습니다.`);
        playerEvals.push({
          player,
          evaluation: {
            rank: -1,
            value: [],
            handName: "N/A",
            bestCards: [],
          },
        });
      }
    });

    if (playerEvals.length > 0) {
      playerEvals.sort((a, b) =>
        compareHandEvaluations(b.evaluation, a.evaluation)
      );

      const winners = [playerEvals[0]];
      for (let i = 1; i < playerEvals.length; i++) {
        if (
          compareHandEvaluations(
            playerEvals[i].evaluation,
            winners[0].evaluation
          ) === 0
        ) {
          winners.push(playerEvals[i]);
        } else {
          break;
        }
      }

      if (winners.length > 0 && winners[0].evaluation.rank === -1) {
        logAction(
          "모든 플레이어의 핸드 평가에 실패하여 팟을 분배할 수 없습니다."
        );
      } else {
        const potPerWinner = Math.floor(pot / winners.length);
        let remainder = pot % winners.length;

        winners.forEach((winnerData, index) => {
          let winAmount = potPerWinner;
          if (remainder > 0) {
            winAmount++;
            remainder--;
          }
          winnerData.player.stack += winAmount;
          logAction(
            `${winnerData.player.name}님이 팟 ${winAmount}원을 가져갑니다! (${
              winnerData.evaluation.handName
            }: ${winnerData.evaluation.bestCards.join(", ")})`
          );
        });
      }
    } else {
      logAction("승자를 결정할 수 없습니다 (플레이어 평가 정보 없음).");
    }
  }

  players.forEach((p) => {
    persistentStacks[p.name] = p.stack;
  });
  saveStacksToLocalStorage();

  const userFinal = players.find((p) => !p.isAI);
  if (userFinal && userFinal.stack <= 0) {
    isUserGameOver = true;
    persistentStacks["User"] = 0;
    logAction("게임 오버! User님의 스택이 0이 되었습니다.");
    document.getElementById("user-action-controls").innerHTML = "";
    saveStacksToLocalStorage();
  } else {
    document.getElementById("user-action-controls").innerHTML =
      '<button onclick="startGame(false)">다음 핸드 시작</button>'; // isNewGame을 false로 전달
  }

  pot = 0;
  renderAll();
  updateActionButtons();
}

function playerFold(player) {
  logAction(`${player.name}: 폴드.`);
  player.status = "folded";
  player.hasActedThisRound = true;
  moveToNextPlayer();
}

function playerCheckCall(player) {
  if (currentBet === 0 || player.currentBetInRound === currentBet) {
    logAction(`${player.name}: 체크.`);
  } else {
    const amountToCall = currentBet - player.currentBetInRound;
    const callAmount = Math.min(amountToCall, player.stack);
    player.stack -= callAmount;
    player.currentBetInRound += callAmount;
    pot += callAmount;
    logAction(`${player.name}: 콜 (${callAmount}원).`);
    if (player.stack === 0) {
      player.status = "allin";
      logAction(`${player.name} 올인!`);
    }
  }
  player.hasActedThisRound = true;
  moveToNextPlayer();
}

function playerBetRaise(player, amount) {
  amount = Math.floor(amount);
  const totalBetAmount = amount;
  const actualBetNeeded = totalBetAmount - player.currentBetInRound;
  const oldCurrentBetForRaiseCalc = currentBet;

  if (player.stack < actualBetNeeded) {
    alert("스택이 부족합니다.");
    if (!player.isAI) updateActionButtons();
    return false;
  }
  if (totalBetAmount < minRaiseAmount && player.stack > totalBetAmount) {
    alert(`최소 베팅/레이즈 금액은 ${minRaiseAmount}원 입니다.`);
    if (!player.isAI) updateActionButtons();
    return false;
  }

  player.stack -= actualBetNeeded;
  player.currentBetInRound += actualBetNeeded;
  pot += actualBetNeeded;

  if (oldCurrentBetForRaiseCalc === 0) {
    logAction(`${player.name}: 베팅 (${totalBetAmount}원).`);
  } else {
    logAction(`${player.name}: 레이즈 (${totalBetAmount}원).`);
  }

  currentBet = totalBetAmount;

  let raiseIncrementMadeByThisPlayer;
  if (oldCurrentBetForRaiseCalc === 0) {
    raiseIncrementMadeByThisPlayer = currentBet;
  } else {
    raiseIncrementMadeByThisPlayer = currentBet - oldCurrentBetForRaiseCalc;
  }
  minRaiseAmount =
    currentBet + Math.max(raiseIncrementMadeByThisPlayer, bigBlindAmount);

  if (player.stack === 0) {
    player.status = "allin";
    logAction(`${player.name} 올인!`);
  }

  player.hasActedThisRound = true;
  players.forEach((p) => {
    if (p !== player && p.status !== "folded" && p.status !== "allin") {
      p.hasActedThisRound = false;
    }
  });
  moveToNextPlayer();
  return true;
}

function moveToNextPlayer() {
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  processTurn();
}

function getHoleCardStrength(holeCards) {
  const card1ValueStr = holeCards[0].slice(0, -1);
  const card1Value = CARD_VALUES_MAP[card1ValueStr];
  const card1Suit = holeCards[0].slice(-1);
  const card2ValueStr = holeCards[1].slice(0, -1);
  const card2Value = CARD_VALUES_MAP[card2ValueStr];
  const card2Suit = holeCards[1].slice(-1);

  if (!card1Value || !card2Value) return "WEAK";

  const isPair = card1Value === card2Value;
  const isSuited = card1Suit === card2Suit;
  const highCardVal = Math.max(card1Value, card2Value);
  const lowCardVal = Math.min(card1Value, card2Value);

  if (isPair && highCardVal >= CARD_VALUES_MAP["10"]) return "STRONG";
  if (
    highCardVal === CARD_VALUES_MAP["A"] &&
    lowCardVal >= CARD_VALUES_MAP["J"]
  )
    return "STRONG";
  if (
    highCardVal === CARD_VALUES_MAP["A"] &&
    lowCardVal === CARD_VALUES_MAP["10"] &&
    isSuited
  )
    return "STRONG";
  if (
    highCardVal === CARD_VALUES_MAP["K"] &&
    lowCardVal >= CARD_VALUES_MAP["Q"] &&
    isSuited
  )
    return "STRONG";
  if (
    highCardVal === CARD_VALUES_MAP["K"] &&
    lowCardVal === CARD_VALUES_MAP["J"] &&
    isSuited
  )
    return "STRONG";
  if (
    highCardVal === CARD_VALUES_MAP["Q"] &&
    lowCardVal === CARD_VALUES_MAP["J"] &&
    isSuited
  )
    return "STRONG";

  if (
    isPair &&
    highCardVal < CARD_VALUES_MAP["10"] &&
    highCardVal >= CARD_VALUES_MAP["7"]
  )
    return "MEDIUM";
  if (
    highCardVal === CARD_VALUES_MAP["A"] &&
    lowCardVal >= CARD_VALUES_MAP["8"]
  )
    return "MEDIUM";
  if (
    isSuited &&
    (highCardVal - lowCardVal === 1 || highCardVal - lowCardVal === 2) &&
    highCardVal >= CARD_VALUES_MAP["8"]
  )
    return "MEDIUM";
  if (
    highCardVal === CARD_VALUES_MAP["K"] &&
    lowCardVal >= CARD_VALUES_MAP["10"]
  )
    return "MEDIUM";
  if (
    highCardVal === CARD_VALUES_MAP["Q"] &&
    lowCardVal >= CARD_VALUES_MAP["10"]
  )
    return "MEDIUM";
  if (
    highCardVal === CARD_VALUES_MAP["J"] &&
    lowCardVal === CARD_VALUES_MAP["10"] &&
    isSuited
  )
    return "MEDIUM";

  if (isPair) return "WEAK";

  return "WEAK";
}

function aiTakeAction(player) {
  logAction(`${player.name}(AI)가 생각 중...`);
  let actionTaken = false;

  if (
    player.status === "folded" ||
    (player.status === "allin" && player.currentBetInRound >= currentBet)
  ) {
    player.hasActedThisRound = true;
    moveToNextPlayer();
    return;
  }

  if (gameState === "preflop") {
    const handStrengthCategory = getHoleCardStrength(player.cards);
    const randomAction = Math.random();
    let betSize = 0;

    if (currentBet === 0) {
      switch (handStrengthCategory) {
        case "STRONG":
          if (randomAction < 0.85) {
            betSize = Math.min(
              player.stack,
              bigBlindAmount * (Math.floor(Math.random() * 2) + 2.5)
            );
            actionTaken = playerBetRaise(player, Math.floor(betSize));
          } else {
            playerCheckCall(player);
            actionTaken = true;
          }
          break;
        case "MEDIUM":
          if (randomAction < 0.6) {
            betSize = Math.min(
              player.stack,
              bigBlindAmount * (Math.floor(Math.random() * 1.5) + 2)
            );
            actionTaken = playerBetRaise(player, Math.floor(betSize));
          } else {
            playerCheckCall(player);
            actionTaken = true;
          }
          break;
        case "WEAK":
          if (randomAction < 0.25) {
            betSize = Math.min(player.stack, bigBlindAmount * 2);
            actionTaken = playerBetRaise(player, Math.floor(betSize));
          } else {
            playerCheckCall(player);
            actionTaken = true;
          }
          break;
      }
    } else {
      const amountToCall = currentBet - player.currentBetInRound;
      if (player.stack <= amountToCall) {
        if (
          handStrengthCategory === "STRONG" ||
          (handStrengthCategory === "MEDIUM" && randomAction < 0.6)
        ) {
          playerCheckCall(player);
        } else {
          playerFold(player);
        }
        actionTaken = true;
      } else {
        switch (handStrengthCategory) {
          case "STRONG":
            if (randomAction < 0.7) {
              betSize = Math.min(
                player.stack,
                currentBet * (2 + Math.random())
              );
              betSize = Math.max(betSize, minRaiseAmount);
              if (player.stack >= betSize - player.currentBetInRound) {
                actionTaken = playerBetRaise(player, Math.floor(betSize));
              } else {
                playerCheckCall(player);
                actionTaken = true;
              }
            } else {
              playerCheckCall(player);
              actionTaken = true;
            }
            break;
          case "MEDIUM":
            if (randomAction < 0.65) {
              playerCheckCall(player);
              actionTaken = true;
            } else if (
              randomAction < 0.8 &&
              amountToCall < player.stack * 0.33
            ) {
              betSize = Math.min(player.stack, currentBet * 2);
              betSize = Math.max(betSize, minRaiseAmount);
              if (player.stack >= betSize - player.currentBetInRound) {
                actionTaken = playerBetRaise(player, Math.floor(betSize));
              } else {
                playerCheckCall(player);
                actionTaken = true;
              }
            } else {
              playerFold(player);
              actionTaken = true;
            }
            break;
          case "WEAK":
            if (
              randomAction < 0.15 &&
              amountToCall <= bigBlindAmount * 3 &&
              amountToCall < player.stack * 0.15
            ) {
              playerCheckCall(player);
              actionTaken = true;
            } else {
              playerFold(player);
              actionTaken = true;
            }
            break;
        }
      }
    }
  } else {
    const random = Math.random();
    if (currentBet === 0) {
      if (random < 0.6) {
        playerCheckCall(player);
        actionTaken = true;
      } else {
        const betAmount = Math.min(
          player.stack,
          Math.max(
            bigBlindAmount,
            Math.floor(player.stack * (0.1 + random * 0.1))
          )
        );
        if (betAmount > 0) {
          actionTaken = playerBetRaise(player, Math.floor(betAmount));
        } else {
          playerCheckCall(player);
          actionTaken = true;
        }
      }
    } else {
      const amountToCall = currentBet - player.currentBetInRound;
      if (player.stack <= amountToCall) {
        if (random < 0.3) {
          playerFold(player);
        } else {
          playerCheckCall(player);
        }
        actionTaken = true;
      } else {
        if (random < 0.4) {
          playerFold(player);
          actionTaken = true;
        } else if (random < 0.8) {
          playerCheckCall(player);
          actionTaken = true;
        } else {
          const raiseOptions = [
            currentBet * 2,
            currentBet * 2.5,
            currentBet * 3,
          ];
          let raiseAmount =
            raiseOptions[Math.floor(Math.random() * raiseOptions.length)];
          raiseAmount = Math.max(minRaiseAmount, raiseAmount);
          raiseAmount = Math.min(player.stack, Math.floor(raiseAmount));

          if (
            raiseAmount > currentBet &&
            player.stack >= raiseAmount - player.currentBetInRound
          ) {
            actionTaken = playerBetRaise(player, Math.floor(raiseAmount));
          } else {
            playerCheckCall(player);
          }
          actionTaken = true;
        }
      }
    }
  }
  if (!actionTaken) {
    logAction(`${player.name}(AI)가 액션 오류로 체크/폴드합니다.`);
    if (
      currentBet > player.currentBetInRound &&
      player.stack >= currentBet - player.currentBetInRound
    ) {
      playerCheckCall(player);
    } else if (currentBet === 0 || player.currentBetInRound === currentBet) {
      playerCheckCall(player);
    } else {
      playerFold(player);
    }
  }
}

function getCardNumericValue(cardStr) {
  return CARD_VALUES_MAP[cardStr.slice(0, -1)];
}
function getSuit(cardStr) {
  return cardStr.slice(-1);
}

function evaluate5CardHand(fiveCardsInput) {
  const fiveCards = fiveCardsInput
    .slice()
    .sort((a, b) => getCardNumericValue(b) - getCardNumericValue(a));
  const values = fiveCards.map(getCardNumericValue);
  const suits = fiveCards.map(getSuit);

  const isFlush = suits.every((s) => s === suits[0]);

  let isStraight = false;
  let straightHighCardValue = 0;
  let straightCards = [];

  const uniqueSortedValues = [...new Set(values)].sort((a, b) => b - a);
  if (uniqueSortedValues.length >= 5) {
    if (
      uniqueSortedValues[0] === 14 &&
      uniqueSortedValues[1] === 13 &&
      uniqueSortedValues[2] === 12 &&
      uniqueSortedValues[3] === 11 &&
      uniqueSortedValues[4] === 10
    ) {
      isStraight = true;
      straightHighCardValue = 14;
      straightCards = fiveCards
        .filter((c) => [14, 13, 12, 11, 10].includes(getCardNumericValue(c)))
        .slice(0, 5);
    } else {
      for (let i = 0; i <= uniqueSortedValues.length - 5; i++) {
        let potentialStraight = true;
        for (let j = 0; j < 4; j++) {
          if (uniqueSortedValues[i + j] - uniqueSortedValues[i + j + 1] !== 1) {
            potentialStraight = false;
            break;
          }
        }
        if (potentialStraight) {
          isStraight = true;
          straightHighCardValue = uniqueSortedValues[i];
          const straightVals = uniqueSortedValues.slice(i, i + 5);
          straightCards = fiveCards
            .filter((c) => straightVals.includes(getCardNumericValue(c)))
            .sort((a, b) => getCardNumericValue(b) - getCardNumericValue(a))
            .slice(0, 5);
          break;
        }
      }
    }
    if (
      !isStraight &&
      uniqueSortedValues.includes(14) &&
      uniqueSortedValues.includes(5) &&
      uniqueSortedValues.includes(4) &&
      uniqueSortedValues.includes(3) &&
      uniqueSortedValues.includes(2)
    ) {
      isStraight = true;
      straightHighCardValue = 5;
      const steelWheelValues = [14, 5, 4, 3, 2];
      straightCards = fiveCards
        .filter((c) => steelWheelValues.includes(getCardNumericValue(c)))
        .sort((a, b) => {
          let valA = getCardNumericValue(a) === 14 ? 1 : getCardNumericValue(a);
          let valB = getCardNumericValue(b) === 14 ? 1 : getCardNumericValue(b);
          return valB - valA;
        })
        .slice(0, 5);
    }
  }

  const valueCounts = {};
  values.forEach((v) => (valueCounts[v] = (valueCounts[v] || 0) + 1));

  let fourKindValue = 0,
    threeKindValue = 0;
  let pairValues = [];
  for (const val in valueCounts) {
    if (valueCounts[val] === 4) fourKindValue = parseInt(val);
    if (valueCounts[val] === 3) threeKindValue = parseInt(val);
    if (valueCounts[val] === 2) pairValues.push(parseInt(val));
  }
  pairValues.sort((a, b) => b - a);

  if (isStraight && isFlush) {
    const handName =
      straightHighCardValue === 14 ? "로열 플러시" : "스트레이트 플러시";
    return {
      rank: HAND_RANKS.STRAIGHT_FLUSH,
      value: [straightHighCardValue],
      handName: handName,
      bestCards: straightCards,
    };
  }
  if (fourKindValue > 0) {
    const kicker = values.find((v) => v !== fourKindValue);
    const best = fiveCards.filter(
      (c) => getCardNumericValue(c) === fourKindValue
    );
    best.push(fiveCards.find((c) => getCardNumericValue(c) === kicker));
    return {
      rank: HAND_RANKS.FOUR_OF_A_KIND,
      value: [fourKindValue, kicker],
      handName: "포카드",
      bestCards: best.slice(0, 5),
    };
  }
  if (threeKindValue > 0 && pairValues.length > 0) {
    const best = fiveCards.filter(
      (c) => getCardNumericValue(c) === threeKindValue
    );
    best.push(
      ...fiveCards
        .filter((c) => getCardNumericValue(c) === pairValues[0])
        .slice(0, 2)
    );
    return {
      rank: HAND_RANKS.FULL_HOUSE,
      value: [threeKindValue, pairValues[0]],
      handName: "풀하우스",
      bestCards: best.slice(0, 5),
    };
  }
  if (isFlush) {
    return {
      rank: HAND_RANKS.FLUSH,
      value: values,
      handName: "플러시",
      bestCards: fiveCards.slice(0, 5),
    };
  }
  if (isStraight) {
    let straightComparisonValue = [straightHighCardValue];
    return {
      rank: HAND_RANKS.STRAIGHT,
      value: straightComparisonValue,
      handName: "스트레이트",
      bestCards: straightCards,
    };
  }
  if (threeKindValue > 0) {
    const kickers = values.filter((v) => v !== threeKindValue).slice(0, 2);
    const best = fiveCards.filter(
      (c) => getCardNumericValue(c) === threeKindValue
    );
    kickers.forEach((kVal) =>
      best.push(
        fiveCards.find(
          (c) => getCardNumericValue(c) === kVal && !best.includes(c)
        )
      )
    );
    return {
      rank: HAND_RANKS.THREE_OF_A_KIND,
      value: [threeKindValue, ...kickers],
      handName: "트리플",
      bestCards: best.slice(0, 5),
    };
  }
  if (pairValues.length >= 2) {
    const kicker = values.find(
      (v) => v !== pairValues[0] && v !== pairValues[1]
    );
    const best = [];
    best.push(
      ...fiveCards
        .filter((c) => getCardNumericValue(c) === pairValues[0])
        .slice(0, 2)
    );
    best.push(
      ...fiveCards
        .filter((c) => getCardNumericValue(c) === pairValues[1])
        .slice(0, 2)
    );
    best.push(
      fiveCards.find(
        (c) => getCardNumericValue(c) === kicker && !best.includes(c)
      )
    );
    return {
      rank: HAND_RANKS.TWO_PAIR,
      value: [pairValues[0], pairValues[1], kicker],
      handName: "투페어",
      bestCards: best.slice(0, 5),
    };
  }
  if (pairValues.length === 1) {
    const kickers = values.filter((v) => v !== pairValues[0]).slice(0, 3);
    const best = fiveCards
      .filter((c) => getCardNumericValue(c) === pairValues[0])
      .slice(0, 2);
    kickers.forEach((kVal) =>
      best.push(
        fiveCards.find(
          (c) => getCardNumericValue(c) === kVal && !best.includes(c)
        )
      )
    );
    return {
      rank: HAND_RANKS.ONE_PAIR,
      value: [pairValues[0], ...kickers],
      handName: "원페어",
      bestCards: best.slice(0, 5),
    };
  }
  return {
    rank: HAND_RANKS.HIGH_CARD,
    value: values,
    handName: "하이카드",
    bestCards: fiveCards.slice(0, 5),
  };
}

function get5CardCombinations(sevenCards) {
  const combinations = [];
  function findCombinations(startIndex, currentCombo) {
    if (currentCombo.length === 5) {
      combinations.push([...currentCombo]);
      return;
    }
    if (startIndex >= sevenCards.length) return;

    currentCombo.push(sevenCards[startIndex]);
    findCombinations(startIndex + 1, currentCombo);
    currentCombo.pop();
    findCombinations(startIndex + 1, currentCombo);
  }
  findCombinations(0, []);
  return combinations;
}

function evaluateBestHand(holeCards, communityCards) {
  const sevenCards = [...holeCards, ...communityCards];
  if (sevenCards.length < 5) return null;

  const fiveCardCombos = get5CardCombinations(sevenCards);
  let bestHandSoFar = null;

  for (const combo of fiveCardCombos) {
    const currentHandEval = evaluate5CardHand(combo);
    if (
      !bestHandSoFar ||
      compareHandEvaluations(currentHandEval, bestHandSoFar) > 0
    ) {
      bestHandSoFar = currentHandEval;
    }
  }
  return bestHandSoFar;
}

function compareHandEvaluations(hand1, hand2) {
  if (!hand1 || !hand2) return 0;
  if (hand1.rank !== hand2.rank) {
    return hand1.rank - hand2.rank;
  }
  for (let i = 0; i < hand1.value.length; i++) {
    if (i >= hand2.value.length) return 1;
    if (hand1.value[i] !== hand2.value[i]) {
      return hand1.value[i] - hand2.value[i];
    }
  }
  if (hand1.value.length < hand2.value.length) return -1;
  return 0;
}

function renderAll() {
  renderPlayers();
  renderCommunityCards();
  renderPot();
  renderGameInfo();
  updateStartButtonState();
  renderLog();
}

function renderPlayers() {
  const playersDiv = document.getElementById("players-display");
  playersDiv.innerHTML = players
    .map(
      (p, index) => `
                <div class="player ${
                  index === currentPlayerIndex &&
                  gameState !== "showdown" &&
                  p.status !== "folded"
                    ? "active-turn"
                    : ""
                } ${p.status === "folded" ? "player-folded" : ""}">
                    <span class="player-name">${p.name} ${
        index === dealerButtonIndex ? "(D)" : ""
      }</span>
                    <span>(${p.stack}원)</span>
                    <span class="player-status">[${p.status}]</span>
                    <div class="player-cards-container">Cards: ${(() => {
                      const getCardColorClass = (card) => {
                        const suit = card.slice(-1);
                        return suit === "♥" || suit === "♦"
                          ? "card-red"
                          : "card-black";
                      };
                      if (p.isAI && gameState !== "showdown") {
                        return '<span class="card placeholder">?</span><span class="card placeholder">?</span>';
                      } else {
                        return p.cards
                          .map(
                            (c) =>
                              `<span class="card ${getCardColorClass(
                                c
                              )}">${c}</span>`
                          )
                          .join("");
                      }
                    })()}</div>
                    ${
                      p.currentBetInRound > 0
                        ? `<div class="player-bet">Bet: ${p.currentBetInRound}원</div>`
                        : ""
                    }
                </div>
            `
    )
    .join("");
}

function renderCommunityCards() {
  let html = communityCards
    .map((c) => {
      const suit = c.slice(-1);
      const colorClass =
        suit === "♥" || suit === "♦" ? "card-red" : "card-black";
      return `<span class="card ${colorClass}">${c}</span>`;
    })
    .join("");
  const placeholdersNeeded = 5 - communityCards.length;
  for (let i = 0; i < placeholdersNeeded; i++) {
    html += `<span class="card placeholder">?</span>`;
  }
  document.getElementById("table-cards").innerHTML = html;
}

function renderPot() {
  document.getElementById("pot-display").textContent = `${pot}원`;
}

function renderGameInfo() {
  document.getElementById("game-state-display").textContent =
    gameState.toUpperCase();
  const currentPlayer = players[currentPlayerIndex];
  document.getElementById("current-turn-display").textContent =
    gameState !== "showdown" && currentPlayer ? currentPlayer.name : "-";
  document.getElementById("dealer-display").textContent = players[
    dealerButtonIndex
  ]
    ? players[dealerButtonIndex].name
    : "-";
}

function logAction(message, type = "info") {
  console.log(message);
  actionsLog.push({
    text: message,
    type: type,
    time: new Date().toLocaleTimeString(),
  });
  if (actionsLog.length > 50) actionsLog.shift();
  renderLog();
}

function renderLog() {
  const logDiv = document.getElementById("game-log");
  logDiv.innerHTML = actionsLog
    .map((log) => `<div class="${log.type}">${log.time} - ${log.text}</div>`)
    .join("");
  logDiv.scrollTop = logDiv.scrollHeight;
}

function setupUserActionButtons() {
  const user = players.find((p) => !p.isAI);
  if (!user) return;

  const actionsDiv = document.getElementById("user-action-controls");
  actionsDiv.innerHTML = `
            <div class="action-group">
                <button id="foldBtn">폴드</button>
                <button id="checkCallBtn">체크/콜</button>
            </div>
            <div class="action-group">
                    <button id="betRaiseBtn">베팅/레이즈</button>
                    <input type="number" id="betAmountInput" placeholder="금액" style="width: 80px; margin-left: 5px;">
            </div>
            <div class="action-group">
                    <button onclick="addBetAmount(10)">+10</button>
                    <button onclick="addBetAmount(100)">+100</button>
                    <button onclick="addBetAmount(500)">+500</button>
                    <button onclick="setAllIn()">올인</button>
                    <button onclick="clearBetAmount()">초기화</button>
                </div>
            `;

  document.getElementById("foldBtn").onclick = () => {
    if (players[currentPlayerIndex] === user && user.status === "active")
      playerFold(user);
  };
  document.getElementById("checkCallBtn").onclick = () => {
    if (
      players[currentPlayerIndex] === user &&
      (user.status === "active" || user.status === "allin")
    )
      playerCheckCall(user);
  };
  document.getElementById("betRaiseBtn").onclick = () => {
    if (players[currentPlayerIndex] === user && user.status === "active") {
      const amountInput = document.getElementById("betAmountInput");
      const amount = parseInt(amountInput.value);
      if (isNaN(amount) || amount <= 0) {
        alert("유효한 금액을 입력하세요.");
        return;
      }
      if (
        amount < (currentBet > 0 ? minRaiseAmount : bigBlindAmount) &&
        user.stack > amount
      ) {
        alert(
          `최소 베팅/레이즈 금액은 ${
            currentBet > 0 ? minRaiseAmount : bigBlindAmount
          }원 입니다. (올인이면 가능)`
        );
        return;
      }
      if (amount > user.stack) {
        alert("스택보다 많은 금액을 베팅할 수 없습니다.");
        return;
      }
      playerBetRaise(user, amount);
      amountInput.value = "";
    }
  };
}

function getBetAmountInput() {
  return document.getElementById("betAmountInput");
}

function addBetAmount(amount) {
  const input = getBetAmountInput();
  let currentValue = parseInt(input.value) || 0;
  input.value = currentValue + amount;
}

function setAllIn() {
  const user = players.find((p) => !p.isAI);
  if (user) {
    getBetAmountInput().value = user.stack;
  }
}

function clearBetAmount() {
  const input = getBetAmountInput();
  input.value = 0;
}

function updateActionButtons() {
  const user = players.find((p) => !p.isAI);

  const isBettingState =
    gameState === "preflop" ||
    gameState === "flop" ||
    gameState === "turn" ||
    gameState === "river";

  if (!isBettingState || !user) {
    const foldBtnExists = document.getElementById("foldBtn");
    if (foldBtnExists) {
      const bettingActionButtons = document.querySelectorAll(
        '#foldBtn, #checkCallBtn, #betRaiseBtn, #user-action-controls button[onclick*="addBetAmount"], #user-action-controls button[onclick*="setAllIn"], #user-action-controls button[onclick*="clearBetAmount"]'
      );
      bettingActionButtons.forEach((btn) => (btn.disabled = true));
      const betAmountInputIfExists = document.getElementById("betAmountInput");
      if (betAmountInputIfExists) betAmountInputIfExists.disabled = true;
    }

    const nextHandButton = document.querySelector(
      '#user-action-controls button[onclick="startGame()"]'
    );
    if (nextHandButton && gameState === "showdown" && !isUserGameOver) {
      nextHandButton.disabled = false;
    }
    return;
  }

  const foldBtn = document.getElementById("foldBtn");
  const checkCallBtn = document.getElementById("checkCallBtn");
  const betRaiseBtn = document.getElementById("betRaiseBtn");
  const betAmountInput = document.getElementById("betAmountInput");
  const amountAdjustmentButtons = document.querySelectorAll(
    '#user-action-controls button[onclick*="addBetAmount"], #user-action-controls button[onclick*="setAllIn"], #user-action-controls button[onclick*="clearBetAmount"]'
  );

  const isUserTurn =
    players[currentPlayerIndex] &&
    players[currentPlayerIndex] === user &&
    user.status === "active";

  const enableBettingButtons = user && isUserTurn && isBettingState;

  if (!foldBtn || !players[currentPlayerIndex]) {
    const allButtonsInActions = document.querySelectorAll(
      "#user-action-controls button"
    );
    allButtonsInActions.forEach((btn) => (btn.disabled = true));
    if (betAmountInput) betAmountInput.disabled = true;
    return;
  }

  foldBtn.disabled = !enableBettingButtons;
  checkCallBtn.disabled = !enableBettingButtons;
  betRaiseBtn.disabled = !enableBettingButtons;
  betAmountInput.disabled = !enableBettingButtons;
  amountAdjustmentButtons.forEach(
    (btn) => (btn.disabled = !enableBettingButtons)
  );

  if (enableBettingButtons) {
    if (currentBet === 0 || user.currentBetInRound === currentBet) {
      checkCallBtn.textContent = "체크";
    } else {
      const amountToCall = currentBet - user.currentBetInRound;
      checkCallBtn.textContent = `콜 (${Math.min(amountToCall, user.stack)}원)`;
    }
    if (currentBet === 0) {
      betRaiseBtn.textContent = "베팅";
    } else {
      betRaiseBtn.textContent = "레이즈";
    }
    let suggestedBet = currentBet === 0 ? bigBlindAmount : minRaiseAmount;
    suggestedBet = Math.min(user.stack, suggestedBet);
    betAmountInput.placeholder = `최소 ${suggestedBet}원`;
  } else {
    if (checkCallBtn) checkCallBtn.textContent = "체크/콜";
    if (betRaiseBtn) betRaiseBtn.textContent = "베팅/레이즈";
    if (betAmountInput) betAmountInput.placeholder = "금액";
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadStacksFromLocalStorage();
  if (
    persistentStacks["User"] === undefined ||
    (persistentStacks["User"] <= 0 && !isUserGameOver)
  ) {
    persistentStacks["User"] = INITIAL_STACK;
    saveStacksToLocalStorage();
  }
  renderAll();
  updateStartButtonState();
  setupUserActionButtons();
  updateActionButtons();
  logAction(
    "텍사스 홀덤 게임에 오신 것을 환영합니다! AI 플레이어 수를 선택하고 게임을 시작하세요."
  );
});
