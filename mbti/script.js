const QUESTIONS = [
  "큰 모임에서 새로운 사람들과 대화하는 것이 즐겁나요?",
  "혼자 시간을 보내는 것보다 다른 사람들과 함께 있는 것을 선호하나요?",
  "파티나 사교 모임에 자주 참석하는 편인가요?",
  "새로운 사람을 만나면 대화를 먼저 시작하는 편인가요?",
  "여러 사람과 함께 일하는 것을 좋아하나요?",
  "세부 사항에 주의를 기울이는 편인가요?",
  "현재에 집중하기보다 미래의 가능성을 상상하는 것을 좋아하나요?",
  "실제 경험을 중요하게 여기나요?",
  "직관이나 영감을 따르는 편인가요?",
  "새로운 아이디어를 생각해내는 것을 즐기나요?",
  "결정을 내릴 때 논리와 사실에 근거하나요?",
  "다른 사람의 감정을 고려하여 결정을 내리는 편인가요?",
  "객관적인 분석을 중요하게 여기나요?",
  "상황을 판단할 때 개인적인 가치관을 중요하게 생각하나요?",
  "감정보다는 이성을 따르는 편인가요?",
  "일정이나 계획을 세우는 것을 좋아하나요?",
  "즉흥적으로 행동하는 것을 즐기나요?",
  "마감 기한을 정해 놓고 일하는 것을 선호하나요?",
  "새로운 정보나 변화에 유연하게 대처하는 편인가요?",
  "결정을 내리기 전에 모든 선택지를 열어두는 것을 좋아하나요?",
  "스트레스 상황에서도 차분함을 유지할 수 있나요?",
  "자신감이 넘치는 편인가요?",
  "실수를 하더라도 크게 신경 쓰지 않는 편인가요?",
  "다른 사람의 의견에 쉽게 영향을 받지 않나요?",
  "자신의 능력에 대해 확신이 있나요?",
];

const BASE_DESCRIPTIONS = {
  ISTJ: "신중하고 조용하며 집중력과 실용성이 뛰어난 현실주의자",
  ISFJ: "조용하고 책임감 있으며 온화한 성격의 헌신적인 보호자",
  INFJ: "인내심이 많고 통찰력이 뛰어나며 창의적인 이상주의자",
  INTJ: "독창적인 마인드와 뛰어난 통찰력을 가진 전략가",
  ISTP: "대담하고 현실적인 성격의 만능 재주꾼",
  ISFP: "따뜻한 감성을 지닌 유연하고 매력적인 예술가",
  INFP: "이상주의적이고 충실하며 풍부한 상상력을 가진 중재자",
  INTP: "혁신적인 발명가 타입의 지적 호기심이 넘치는 사색가",
  ESTP: "친구와 즐기기를 좋아하는 현실주의적인 모험가",
  ESFP: "즉흥적이고 열정적이며 넘치는 에너지의 연예인 타입",
  ENFP: "열정적이고 창의적인 성격의 자유로운 영혼",
  ENTP: "지적 도전을 즐기는 영리하고 호기심 많은 발명가",
  ESTJ: "체계적이고 헌신적이며 실용적인 관리자 타입",
  ESFJ: "사교적이고 배려심 많은 마음 따뜻한 주최자",
  ENFJ: "카리스마 있는 리더십의 정의로운 사회운동가 타입",
  ENTJ: "대담하고 상상력이 풍부한 강한 의지의 지도자",
};

const ASSERTIVE_TURBULENT_DESCRIPTIONS = {
  "-A": "입니다. 자신감이 있고 스트레스에 강한 편입니다.",
  "-T": "입니다. 완벽주의 성향이 있고 자기 개선에 열심인 편입니다.",
};

const DEFAULT_IMAGE_PATH = "images/default.png";

const dom = {
  questionElement: document.getElementById("question"),
  yesButton: document.getElementById("yes"),
  noButton: document.getElementById("no"),
  resultElement: document.getElementById("result"),
  mbtiResultElement: document.getElementById("mbti-result"),
  mbtiDescriptionElement: document.getElementById("mbti-description"),
  questionNumberElement: document.getElementById("question-number"),
  restartButton: document.getElementById("restart-button"),
  startScreen: document.getElementById("start-screen"),
  startButton: document.getElementById("start-button"),
  container: document.querySelector(".container"),
  mbtiImageElement: document.getElementById("mbti-image"),
  progressBar: document.getElementById("progress-bar"), //추가
};

const buttonClickSound = new Audio("button_click.mp3");
const resultSound = new Audio("result_sound.mp3");

let currentQuestion = 0;
let answers = new Array(QUESTIONS.length).fill(0);

function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
}

function updateProgressBar() {
  const progress = (currentQuestion / QUESTIONS.length) * 100;
  dom.progressBar.style.width = `${progress}%`;
}

function showQuestion() {
  if (currentQuestion < QUESTIONS.length) {
    dom.questionNumberElement.textContent = `질문 ${currentQuestion + 1}`;
    dom.questionElement.textContent = QUESTIONS[currentQuestion];
    updateProgressBar();
  } else {
    showResult();
  }
}

function answerQuestion(answer) {
  playSound(buttonClickSound);
  answers[currentQuestion] += answer ? 1 : 0;
  currentQuestion++;
  showQuestion();
}

function calculateMBTI() {
  let result = "";
  result += answers.slice(0, 5).reduce((a, b) => a + b) > 2 ? "E" : "I";
  result += answers.slice(5, 10).reduce((a, b) => a + b) > 2 ? "S" : "N";
  result += answers.slice(10, 15).reduce((a, b) => a + b) > 2 ? "T" : "F";
  result += answers.slice(15, 20).reduce((a, b) => a + b) > 2 ? "J" : "P";
  result += answers.slice(20, 25).reduce((a, b) => a + b) > 2 ? "-A" : "-T";
  return result;
}

function getMBTIDescription(mbti) {
  const baseType = mbti.slice(0, 4);
  const assertiveTurbulent = mbti.slice(4);
  return (
    BASE_DESCRIPTIONS[baseType] +
    ASSERTIVE_TURBULENT_DESCRIPTIONS[assertiveTurbulent]
  );
}

function setMBTIImage(mbti) {
  const baseType = mbti.slice(0, 4);
  const imagePath = `images/${baseType}.png`;

  if (!dom.mbtiImageElement.hasChildNodes()) {
    const img = document.createElement("img");
    img.id = "mbti-img";
    img.style.width = "150px";
    dom.mbtiImageElement.appendChild(img);
  }

  const imgElement = document.getElementById("mbti-img");

  fetch(imagePath)
    .then((response) => {
      imgElement.src = response.ok ? imagePath : DEFAULT_IMAGE_PATH;
    })
    .catch(() => {
      imgElement.src = DEFAULT_IMAGE_PATH;
    });
}

function showResult() {
  document.getElementById("question-container").style.display = "none";
  dom.resultElement.style.display = "block";

  playSound(resultSound);

  const mbti = calculateMBTI();
  dom.mbtiResultElement.textContent = mbti;
  dom.mbtiDescriptionElement.textContent = getMBTIDescription(mbti);
  setMBTIImage(mbti);
}

function restartTest() {
  playSound(buttonClickSound);
  currentQuestion = 0;
  answers.fill(0);
  document.getElementById("question-container").style.display = "none";
  dom.resultElement.style.display = "none";
  dom.startScreen.style.display = "block";
  dom.container.style.display = "block";
  const imgElement = document.getElementById("mbti-img");
  if (imgElement) imgElement.src = "";
  updateProgressBar();
}

function startTest() {
  playSound(buttonClickSound);
  dom.startScreen.style.display = "none";
  document.getElementById("question-container").style.display = "block";
  dom.container.style.display = "block";
  showQuestion();
}

dom.yesButton.addEventListener("click", () => answerQuestion(true));
dom.noButton.addEventListener("click", () => answerQuestion(false));
dom.restartButton.addEventListener("click", restartTest);
dom.startButton.addEventListener("click", startTest);

dom.startScreen.style.display = "block";
document.getElementById("question-container").style.display = "none";
