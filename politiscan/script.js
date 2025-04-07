const QUESTIONS_FILE = "questions.json";

const WEIGHTS = {
  "radical-progressive": 3,
  "moderate-progressive": 2,
  "social-progressive": 2,
  "economic-progressive": 2,
  "progressive-leaning-moderate": 1.5,
  "pragmatic-moderate": 1,
  "balanced-moderate": 1,
  moderate: 1,
  "conservative-leaning-moderate": 1.5,
  "moderate-conservative": 2,
  "economic-conservative": 2,
  "social-conservative": 2,
  "traditional-conservative": 3,
};

const TYPE_DESCRIPTIONS = {
  "radical-progressive":
    "사회의 근본적인 변화를 추구하며, 기존의 질서에 대한 비판적 시각을 가집니다. 사회적 평등과 소수자의 권리 신장에 큰 관심을 보입니다.",
  "moderate-progressive":
    "점진적인 사회 변화를 지향하며, 사회적 불평등 해소와 복지 확대를 중시합니다. 급진적인 변화보다는 현실적인 개선을 선호합니다.",
  "social-progressive":
    "사회적 약자와 소수자의 권리 보호에 중점을 둡니다. 성 평등, 인종 차별 반대, LGBTQ+ 권리 옹호 등 사회적 정의 실현을 위해 노력합니다.",
  "economic-progressive":
    "경제적 불평등 해소와 노동자의 권리 보호를 강조합니다. 부의 재분배와 공정한 경제 시스템 구축을 지향합니다.",
  "progressive-leaning-moderate":
    "진보적 가치를 지향하지만, 급진적인 변화보다는 점진적인 개선을 선호합니다. 실용적인 정책을 중시하며, 다양한 의견을 수용하려 노력합니다.",
  "pragmatic-moderate":
    "이념보다는 실질적인 문제 해결을 우선시합니다. 현실적인 정책 대안을 찾고, 다양한 의견을 조율하여 합의점을 찾는 데 집중합니다.",
  "balanced-moderate":
    "진보와 보수 양쪽의 의견을 균형 있게 고려하며, 극단적인 입장을 피하려 합니다. 사회적 안정과 조화를 중시합니다.",
  moderate:
    "특정 이념에 치우치지 않고, 다양한 의견을 수용하려 노력합니다. 사회적 안정과 조화를 중시하며, 실용적인 문제 해결을 추구합니다.",
  "conservative-leaning-moderate":
    "보수적 가치를 지향하지만, 극단적인 입장을 피하고 점진적인 변화를 선호합니다. 사회적 안정과 전통을 중시합니다.",
  "moderate-conservative":
    "전통적인 가치를 존중하면서도, 사회 변화에 대한 유연성을 가집니다. 점진적인 변화를 통해 사회적 안정을 유지하려 합니다.",
  "economic-conservative":
    "자유 시장 경제와 개인의 경제적 자유를 중시합니다. 정부의 경제 개입을 최소화하고, 기업의 자율성을 강조합니다.",
  "social-conservative":
    "전통적인 사회 규범과 가치를 중시합니다. 가족 중심의 사회 구조와 도덕적 가치를 강조합니다.",
  "traditional-conservative":
    "전통적인 가치와 질서를 최우선으로 여기며, 급격한 사회 변화를 경계합니다. 사회적 안정과 전통 유지를 위해 노력합니다.",
};

let questions = [];
let currentQuestionIndex = 0;
let selectedAnswers = [];

const startBtn = document.getElementById("start-btn");
const quizSection = document.getElementById("quiz-section");
const introSection = document.getElementById("intro-section");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const nextBtn = document.getElementById("next-btn");
const resultSection = document.getElementById("result-section");
const resultText = document.getElementById("result-text");
const restartBtn = document.getElementById("restart-btn");
const progress = document.getElementById("progress");
const resultGraph = document.getElementById("result-graph");

startBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", handleNextQuestion);
restartBtn.addEventListener("click", restartQuiz);

function loadQuestions() {
  fetch(QUESTIONS_FILE)
    .then((response) => response.json())
    .then((data) => {
      questions = data;
      startBtn.disabled = false;
    })
    .catch((error) => {
      console.error("Error loading questions:", error);
    });
}

function startQuiz() {
  introSection.style.display = "none";
  quizSection.style.display = "block";
  updateProgressBar();
  displayQuestion();
}

function displayQuestion() {
  const currentQuestion = questions[currentQuestionIndex];
  questionText.textContent = currentQuestion.text;
  optionsContainer.innerHTML = "";

  currentQuestion.options.forEach((option, index) => {
    const optionBtn = createOptionButton(option, index);
    optionsContainer.appendChild(optionBtn);
  });

  nextBtn.disabled = true;
}

function createOptionButton(option, index) {
  const optionBtn = document.createElement("button");
  optionBtn.textContent = option.text;
  optionBtn.classList.add("option-btn");
  optionBtn.addEventListener("click", () =>
    handleOptionSelection(option, optionBtn)
  );
  return optionBtn;
}

function handleOptionSelection(option, selectedButton) {
  selectedAnswers.push(option);
  nextBtn.disabled = false;
  clearOptionSelection();
  selectedButton.classList.add("selected");
}

function clearOptionSelection() {
  const optionButtons = document.querySelectorAll(".option-btn");
  optionButtons.forEach((btn) => btn.classList.remove("selected"));
}

function handleNextQuestion() {
  currentQuestionIndex++;
  updateProgressBar();
  if (currentQuestionIndex < questions.length) {
    displayQuestion();
  } else {
    displayResults();
  }
}

function displayResults() {
  quizSection.style.display = "none";
  resultSection.style.display = "block";

  const results = calculateResults();
  const overallResults = getOverallTendency(results);
  updateResultSection(overallResults);
  updateResultDescription(results, overallResults);
}

function calculateResults() {
  const resultCounts = {};
  questions.forEach((question) => {
    question.options.forEach((option) => {
      if (option.type && !resultCounts[option.type]) {
        resultCounts[option.type] = 0;
      }
    });
  });
  Object.keys(WEIGHTS).forEach((type) => {
    if (!resultCounts[type]) {
      resultCounts[type] = 0;
    }
  });

  selectedAnswers.forEach((answer) => {
    if (answer.type) {
      resultCounts[answer.type]++;
    }
  });

  const weightedResults = {};
  for (const type in resultCounts) {
    weightedResults[type] = resultCounts[type] * WEIGHTS[type];
  }

  return weightedResults;
}

function updateResultSection(overallResults) {
  resultGraph.innerHTML = "";

  const total = Object.values(overallResults).reduce(
    (sum, value) => sum + value,
    0
  );
  const normalizedResults = {};
  for (const key in overallResults) {
    normalizedResults[key] =
      total > 0 ? (overallResults[key] / total) * 100 : 0;
  }

  const graphData = Object.entries(normalizedResults).map(([label, value]) => ({
    label: getKoreanOverallLabel(label),
    value,
  }));

  graphData.sort((a, b) => b.value - a.value);

  const maxPercentage = Math.max(...graphData.map((item) => item.value));
  graphData.forEach((item) => {
    const barContainer = createBarContainer(item, maxPercentage, item.label);
    resultGraph.appendChild(barContainer);
  });
}

function createBarContainer(item, maxPercentage, label) {
  const barContainer = document.createElement("div");
  barContainer.classList.add("graph-bar-container");

  const labelDiv = document.createElement("div");
  labelDiv.classList.add("graph-bar-label");
  labelDiv.textContent = label;
  barContainer.appendChild(labelDiv);

  const bar = document.createElement("div");
  bar.classList.add("graph-bar");
  bar.style.width = `${
    maxPercentage > 0 ? (item.value / maxPercentage) * 100 : 0
  }%`;
  bar.style.backgroundColor = getBarColor(label);

  const percentageDiv = document.createElement("div");
  percentageDiv.classList.add("graph-bar-percentage");
  percentageDiv.textContent = `${item.value.toFixed(1)}%`;
  bar.appendChild(percentageDiv);

  barContainer.appendChild(bar);
  return barContainer;
}

function getBarColor(label) {
  const colorMap = {
    진보: "var(--progressive-color)",
    중도: "var(--moderate-color)",
    보수: "var(--conservative-color)",
  };
  if (!colorMap[label]) {
    console.error("getBarColor : not found label", label);
    return "black";
  }
  return colorMap[label];
}

function updateResultDescription(results, overallResults) {
  const sortedOverallResults = Object.entries(overallResults).sort(
    ([, a], [, b]) => b - a
  );
  const topOverallType = sortedOverallResults[0][0];
  const topOverallScore = sortedOverallResults[0][1];

  const sortedResults = Object.entries(results).sort(([, a], [, b]) => b - a);
  const topResultType = sortedResults[0][0];
  const topResultScore = sortedResults[0][1];

  let description = "";
  let detailDescription = "";

  if (topOverallScore > 0) {
    description = `당신의 정치 성향은 전반적으로 ${getKoreanOverallLabel(
      topOverallType
    )} 성향에 가깝습니다.`;

    const totalScore = Object.values(results).reduce(
      (sum, score) => sum + score,
      0
    );
    const topResultPercentage =
      totalScore > 0 ? (topResultScore / totalScore) * 100 : 0;

    detailDescription = `세부적으로는 ${getKoreanLabel(
      topResultType
    )} 성향이 ${topResultPercentage.toFixed(1)}%로 가장 높게 나타났습니다. `;
    detailDescription += TYPE_DESCRIPTIONS[topResultType]
      ? `이러한 성향은 ${TYPE_DESCRIPTIONS[topResultType]}`
      : "";
  } else {
    description = "당신의 정치 성향을 명확히 정의하기 어렵습니다.";
    detailDescription =
      "다양한 정치적 견해를 고루 가지고 계신 것으로 보입니다.";
  }

  resultText.textContent = description + detailDescription;
}

function getKoreanLabel(label) {
  const labelMap = {
    "radical-progressive": "급진적 진보",
    "moderate-progressive": "온건 진보",
    "social-progressive": "사회적 진보",
    "economic-progressive": "경제적 진보",
    "progressive-leaning-moderate": "중도 진보",
    "pragmatic-moderate": "실용주의 중도",
    "balanced-moderate": "균형 중도",
    moderate: "중도",
    "conservative-leaning-moderate": "중도 보수",
    "moderate-conservative": "온건 보수",
    "economic-conservative": "경제적 보수",
    "social-conservative": "사회적 보수",
    "traditional-conservative": "전통적 보수",
  };
  return labelMap[label] || label;
}

function getKoreanOverallLabel(label) {
  const labelMap = {
    progressive: "진보",
    moderate: "중도",
    conservative: "보수",
  };
  if (!labelMap[label]) {
    console.error("getKoreanOverallLabel : not found label", label);
    return "알수없음";
  }
  return labelMap[label];
}

function getOverallTendency(results) {
  let progressive = 0;
  let moderate = 0;
  let conservative = 0;

  const progressiveTypes = [
    "radical-progressive",
    "moderate-progressive",
    "social-progressive",
    "economic-progressive",
  ];
  const moderateTypes = [
    "pragmatic-moderate",
    "balanced-moderate",
    "moderate",
    "progressive-leaning-moderate",
    "conservative-leaning-moderate",
  ];
  const conservativeTypes = [
    "moderate-conservative",
    "economic-conservative",
    "social-conservative",
    "traditional-conservative",
  ];

  for (const type in results) {
    if (progressiveTypes.includes(type)) {
      progressive += results[type];
    } else if (moderateTypes.includes(type)) {
      moderate += results[type];
    } else if (conservativeTypes.includes(type)) {
      conservative += results[type];
    }
  }

  return {
    progressive,
    moderate,
    conservative,
  };
}

function restartQuiz() {
  resultSection.style.display = "none";
  introSection.style.display = "block";
  currentQuestionIndex = 0;
  selectedAnswers = [];
  progress.value = 0;
}

function updateProgressBar() {
  const progressPercentage = (currentQuestionIndex / questions.length) * 100;
  progress.value = progressPercentage;
}

window.addEventListener("load", () => {
  startBtn.disabled = true;
  loadQuestions();
});

window.addEventListener("keydown", (event) => {
  if (quizSection.style.display === "block") {
    const key = event.key;
    const optionButtons = document.querySelectorAll(".option-btn");
    if (key >= "1" && key <= String(optionButtons.length)) {
      const index = parseInt(key) - 1;
      if (index < optionButtons.length) {
        const selectedButton = optionButtons[index];
        const selectedOption = questions[currentQuestionIndex].options[index];
        selectedButton.click();
      }
    }
  }
});
