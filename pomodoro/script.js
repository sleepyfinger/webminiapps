let timer;
let timeLeft = 1500; // 25분 (초 단위)

const timerDisplay = document.getElementById("timer");
const startButton = document.getElementById("start");
const resetButton = document.getElementById("reset");

const circle = document.querySelector(".progress-ring__circle");
const radius = circle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;

circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

function setProgress(percent) {
  const offset = circumference - (percent / 100) * circumference;
  circle.style.strokeDashoffset = offset;
}

function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
  setProgress(((1500 - timeLeft) / 1500) * 100);
}

function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    updateDisplay();
    if (timeLeft === 0) {
      clearInterval(timer);
      alert("뽀모도로 세션이 끝났습니다!");
    }
  }, 1000);
  startButton.textContent = "일시정지";
  startButton.onclick = pauseTimer;
}

function pauseTimer() {
  clearInterval(timer);
  startButton.textContent = "계속";
  startButton.onclick = startTimer;
}

function resetTimer() {
  clearInterval(timer);
  timeLeft = 1500;
  updateDisplay();
  startButton.textContent = "시작";
  startButton.onclick = startTimer;
}

startButton.onclick = startTimer;
resetButton.onclick = resetTimer;

updateDisplay();
