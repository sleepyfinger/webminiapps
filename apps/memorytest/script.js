const mainMenu = document.getElementById("main-menu");
const gameScreen = document.getElementById("game-screen");
const resultScreen = document.getElementById("result-screen");
const gameContainer = document.getElementById("game-container");
const levelDisplay = document.getElementById("level");
const gameMessage = document.getElementById("game-message");
const resultMessage = document.getElementById("result-message");
const startGameBtn = document.getElementById("start-game-btn");
const restartBtn = document.getElementById("restart-btn");
const shareBtn = document.getElementById("share-btn");

const MAX_CELLS = 9;
const BASE_SHOW_DURATION = 450;
const BASE_INTERVAL_DURATION = 900;
const CLICK_FEEDBACK_DURATION = 150;
const LEVEL_SUCCESS_DELAY = 1000;
const ERROR_SHAKE_DURATION = 500;
const SCORE_PER_LEVEL = 100;

let level = 1;
let sequence = [];
let userSequence = [];
let displayingSequence = false;
let userTurn = false;

startGameBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", goToMainMenu);
shareBtn.addEventListener("click", shareResult);

function showScreen(screenToShow) {
  [mainMenu, gameScreen, resultScreen].forEach((screen) => {
    screen.classList.remove("active");
    if (!screen.classList.contains("hidden")) {
      screen.classList.add("hidden");
    }
  });
  screenToShow.classList.remove("hidden");
  screenToShow.classList.add("active");
}

function goToMainMenu() {
  showScreen(mainMenu);
}

function startGame() {
  showScreen(gameScreen);
  level = 1;
  gameMessage.textContent = "준비...";
  setupGameContainer();
  setTimeout(startLevel, 500);
}

function setupGameContainer() {
  gameContainer.innerHTML = "";
  for (let i = 1; i <= MAX_CELLS; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell", "hidden");
    cell.dataset.number = i;
    gameContainer.appendChild(cell);
    cell.addEventListener("click", () => handleUserInput(i));
  }
}

function startLevel() {
  levelDisplay.textContent = level;
  sequence = generateSequence(level);
  userSequence = [];
  displayingSequence = true;
  userTurn = false;
  gameMessage.textContent = "잘 보세요!";

  displaySequence(sequence);
}

function generateSequence(length) {
  const seq = [];
  for (let i = 0; i < length; i++) {
    const randomNumber = Math.floor(Math.random() * MAX_CELLS) + 1;
    seq.push(randomNumber);
  }
  return seq;
}

function displaySequence(sequenceToDisplay) {
  let delay = 500;
  const showDuration = Math.max(150, BASE_SHOW_DURATION - level * 15);
  const intervalDuration = Math.max(300, BASE_INTERVAL_DURATION - level * 30);

  sequenceToDisplay.forEach((number, index) => {
    setTimeout(() => {
      const cell = gameContainer.querySelector(
        `.cell[data-number="${number}"]`
      );
      if (cell) {
        cell.textContent = number;
        cell.classList.remove("hidden");
        cell.classList.add("revealed", "active");

        setTimeout(() => {
          cell.classList.remove("revealed", "active");
          cell.classList.add("hidden");
          cell.textContent = "";

          if (index === sequenceToDisplay.length - 1) {
            displayingSequence = false;
            userTurn = true;
            gameMessage.textContent = "따라 해보세요!";
          }
        }, showDuration);
      }
    }, delay);
    delay += intervalDuration;
  });
}

function handleUserInput(number) {
  if (displayingSequence || !userTurn) {
    return;
  }

  const clickedCell = gameContainer.querySelector(
    `.cell[data-number="${number}"]`
  );
  if (clickedCell) {
    clickedCell.classList.add("clicked");
    setTimeout(() => {
      clickedCell.classList.remove("clicked");
    }, CLICK_FEEDBACK_DURATION);
  }

  userSequence.push(number);
  const currentIndex = userSequence.length - 1;

  if (userSequence[currentIndex] !== sequence[currentIndex]) {
    handleIncorrectInput();
    return;
  }

  if (userSequence.length === sequence.length) {
    handleCorrectSequence();
  }
}

function handleIncorrectInput() {
  userTurn = false;
  gameMessage.textContent = "실패! 삐빅-";
  gameContainer.classList.add("error-shake");

  setTimeout(() => {
    gameContainer.classList.remove("error-shake");
    showResult();
  }, ERROR_SHAKE_DURATION);
}

function handleCorrectSequence() {
  userTurn = false;
  gameMessage.textContent = `레벨 ${level} 클리어! ✨`;

  setTimeout(() => {
    level++;
    gameMessage.textContent = "준비...";
    startLevel();
  }, LEVEL_SUCCESS_DELAY);
}

function showResult() {
  showScreen(resultScreen);

  const finalLevel = level - 1;
  const memoryScore = finalLevel * SCORE_PER_LEVEL;

  let evaluationText;
  let scoreTier;

  if (finalLevel <= 1) {
    evaluationText = "아직 감을 잡는 중! 🧐 다시 해보면 훨씬 잘할 거예요!";
    scoreTier = "D";
  } else if (finalLevel <= 3) {
    evaluationText = "괜찮아요! ✨ 조금만 더 집중하면 실력이 쑥쑥 늘 거예요!";
    scoreTier = "C";
  } else if (finalLevel <= 5) {
    evaluationText = "오! 제법인데요? 😎 집중력이 점점 좋아지고 있어요!";
    scoreTier = "B";
  } else if (finalLevel <= 7) {
    evaluationText = "와우! 🤩 상당한 기억력의 소유자시네요! 멋져요!";
    scoreTier = "A";
  } else if (finalLevel <= 9) {
    evaluationText = "대단해요! 🏆 거의 완벽에 가까운 기억력이에요!";
    scoreTier = "S";
  } else {
    evaluationText = "당신은 혹시.. AI? 🤖 인간의 한계를 넘은 기억력! 최고!";
    scoreTier = "SSS";
  }

  resultMessage.textContent = `최종 레벨 ${finalLevel} 달성! 🎉\n기억력 점수: ${memoryScore}점 (등급: ${scoreTier})\n\n${evaluationText}`;
}

function shareResult() {
  const finalLevel = level - 1;
  const memoryScore = finalLevel * SCORE_PER_LEVEL;
  const shareText = `✨ 반짝반짝 기억력 테스트 ✨에서 ${finalLevel} 레벨 클리어! (기억력 점수: ${memoryScore}점) 😎 내 기억력 이 정도야~ 너도 도전해봐! 👇`;
  const shareUrl = window.location.href;

  if (navigator.share) {
    navigator
      .share({
        title: "✨ 반짝반짝 기억력 테스트 ✨",
        text: shareText,
        url: shareUrl,
      })
      .catch((error) => {
        console.error("공유 실패:", error);
        alert(
          "공유 기능을 사용할 수 없어요. 😥 대신 결과가 클립보드에 복사되었으니 직접 붙여넣어 공유해주세요!"
        );
        copyToClipboardFallback(shareText, shareUrl);
      });
  } else {
    copyToClipboardFallback(shareText, shareUrl);
  }
}

function copyToClipboardFallback(text, url) {
  navigator.clipboard
    .writeText(`${text} ${url}`)
    .then(() => {
      alert("결과가 클립보드에 복사되었어요! 친구들에게 공유해보세요!");
    })
    .catch((err) => {
      console.error("클립보드 복사 실패:", err);
      alert(
        "이 브라우저에서는 자동 공유 및 복사를 지원하지 않아요. 😥 직접 링크를 복사해주세요!"
      );
    });
}

showScreen(mainMenu);
