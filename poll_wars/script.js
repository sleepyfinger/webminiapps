let supportA = 50;
let supportB = 50;
const maxDays = 60;
let currentDay = 1;
const supportHistoryA = [supportA, supportA];
const supportHistoryB = [supportB, supportB];
const days = [1, 2];

const ctx = document.getElementById("supportChart").getContext("2d");

let chart;
let messageTimeout;

function createChart() {
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: days,
      datasets: [
        {
          label: "후보 A 🐻",
          data: supportHistoryA,
          borderColor: "#4BC0C0",
          backgroundColor: "rgba(75, 192, 192, 0.3)",
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
        {
          label: "후보 B 🦊",
          data: supportHistoryB,
          borderColor: "#FF6384",
          backgroundColor: "rgba(255, 99, 132, 0.3)",
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 20,
          bottom: 20,
        },
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: {
              size: 16,
            },
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          bodyFont: {
            size: 14,
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "날짜",
            font: {
              size: 16,
            },
          },
          ticks: {
            font: {
              size: 14,
            },
          },
          type: "linear",
          min: 1,
          max: maxDays,
          stepSize: 1,
        },
        y: {
          title: {
            display: true,
            text: "지지율 (%)",
            font: {
              size: 16,
            },
          },
          min: 0,
          max: 100,
          ticks: {
            font: {
              size: 14,
            },
          },
        },
      },
    },
  });
}

function updateChart() {
  if (supportHistoryA.length === 0 || supportHistoryB.length === 0) {
    return;
  }

  chart.data.labels = days;
  chart.data.datasets[0].data = supportHistoryA;
  chart.data.datasets[1].data = supportHistoryB;

  chart.update();
}

function playGame(candidate) {
  if (currentDay > maxDays) return;

  const change = Math.floor(Math.random() * 11) - 5;

  if (candidate === "A") {
    supportA = Math.min(Math.max(supportA + change, 0), 100);
    supportB = Math.max(100 - supportA, 0);
    showMessage("A", change);
  } else if (candidate === "B") {
    supportB = Math.min(Math.max(supportB + change, 0), 100);
    supportA = Math.max(100 - supportB, 0);
    showMessage("B", change);
  }

  document.getElementById("supportA").innerText = supportA;
  document.getElementById("supportB").innerText = supportB;

  days.push(++currentDay);
  supportHistoryA.push(supportA);
  supportHistoryB.push(supportB);

  document.getElementById("currentDay").innerText = currentDay;
  updateChart();

  if (currentDay > maxDays) endGame();
}

function showMessage(candidate, change) {
  const resultElement = document.getElementById("result");

  if (messageTimeout) {
    clearTimeout(messageTimeout);
  }

  if (!resultElement.classList.contains("show")) {
    resultElement.classList.add("show");
  }

  resultElement.innerText =
    change > 0
      ? `🎉 후보 ${candidate}의 지지율이 ${change}% 올랐어요!`
      : change < 0
      ? `😢 후보 ${candidate}의 지지율이 ${Math.abs(change)}% 떨어졌어요...`
      : `😐 후보 ${candidate}의 지지율에 변화가 없어요.`;

  messageTimeout = setTimeout(() => {
    resultElement.classList.remove("show");
  }, 3000);
}

function endGame() {
  const popupOverlay = document.getElementById("popupOverlay");
  const winner =
    supportA > supportB
      ? "후보 A 🐻"
      : supportB > supportA
      ? "후보 B 🦊"
      : "동률";
  const message =
    supportA === supportB
      ? "두 후보가 동률입니다! 다시 도전해보세요!"
      : `🎉 ${winner}가 승리했습니다! 축하합니다!`;
  document.getElementById("popupTitle").innerText = "최종 결과";
  document.getElementById("popupMessage").innerText = message;
  popupOverlay.classList.add("active");
  disableButtons();
}

function disableButtons() {
  document
    .querySelectorAll(".button")
    .forEach((button) => (button.disabled = true));
}

function restartGame() {
  supportA = 50;
  supportB = 50;
  currentDay = 1;
  supportHistoryA.length = 0;
  supportHistoryB.length = 0;
  days.length = 0;
  supportHistoryA.push(supportA, supportA);
  supportHistoryB.push(supportB, supportB);
  days.push(1, 2);

  document.getElementById("supportA").innerText = supportA;
  document.getElementById("supportB").innerText = supportB;
  document.getElementById("currentDay").innerText = currentDay;

  updateChart();

  enableButtons();

  document.getElementById("popupOverlay").classList.remove("active");
}

function enableButtons() {
  document
    .querySelectorAll(".button")
    .forEach((button) => (button.disabled = false));
}

createChart();
