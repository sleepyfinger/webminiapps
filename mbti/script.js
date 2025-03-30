const QUESTIONS = {
  simple: [
    "친구들과 어울려 노는 것을 좋아하나요?", // E/I (1)
    "혼자 조용히 책 읽는 시간을 선호하나요?", // E/I (2)
    "새로운 친구를 사귀는 것이 어렵지 않나요?", // E/I (3)
    "여럿이 함께 하는 게임을 즐기나요?", // E/I (4)
    "친구들 앞에서 발표하는 것이 편안한가요?", // E/I (5)
    "눈에 보이는 것을 자세히 관찰하는 편인가요?", // S/N (6)
    "상상 속에서 새로운 세상을 만드는 것을 좋아하나요?", // S/N (7)
    "직접 만지고 경험하는 것이 중요하다고 생각하나요?", // S/N (8)
    "갑자기 떠오르는 생각이 많은 편인가요?", // S/N (9)
    "이야기 속 주인공이 되어 상상하는 것을 즐기나요?", // S/N (10)
    "결정할 때 명확한 이유가 있어야 하나요?", // T/F (11)
    "다른 사람의 기분을 잘 알아차리는 편인가요?", // T/F (12)
    "정해진 규칙을 지키는 것이 중요하다고 생각하나요?", // T/F (13)
    "친구가 슬퍼하면 함께 마음이 아픈가요?", // T/F (14)
    "누군가를 돕는 일에 기쁨을 느끼나요?", // T/F (15)
    "미리 계획을 세우고 움직이는 것이 편한가요?", // J/P (16)
    "하고 싶은 일이 생기면 바로 하는 편인가요?", // J/P (17)
    "해야 할 일을 미루지 않고 바로 처리하나요?", // J/P (18)
    "새로운 환경에 빠르게 적응하는 편인가요?", // J/P (19)
    "결정할 때 여러 가능성을 고려하는 편인가요?", // J/P (20)
    "힘든 일이 있어도 금방 잊는 편인가요?", // -A/-T (21)
    "자신이 잘하는 것이 많다고 생각하나요?", // -A/-T (22)
    "실수해도 괜찮다고 생각하나요?", // -A/-T (23)
    "다른 사람의 말에 쉽게 흔들리지 않나요?", // -A/-T (24)
    "자신이 할 수 있다고 믿는 편인가요?", // -A/-T (25)
  ],
  "super-simple": [
    "친구들과 어울리는 것을 선호하나요?", // E/I
    "상상하는 것을 좋아하나요?", // S/N
    "결정할 때 논리적인 편인가요?", // T/F
    "계획을 세우는 것을 선호하나요?", // J/P
    "자신감이 넘치는 편인가요?", // -A/-T
  ],
};

const BASE_DESCRIPTIONS = {
  ISTJ: "꼼꼼하고 차분한 **현실주의자**예요. 약속을 잘 지키고, 맡은 일은 끝까지 해내는 책임감이 강해요. 조용히 혼자서 집중하는 걸 좋아하고, 규칙을 잘 지키는 모범생 스타일이에요. 주변을 잘 살피고, 정리정돈을 잘하는 깔끔한 친구랍니다.",
  ISFJ: "따뜻하고 친절한 **수호천사**예요. 다른 사람들을 잘 챙겨주고, 도와주는 걸 좋아해요. 조용하지만 속정이 깊고, 주변 사람들을 배려하는 마음이 커요. 친구들의 고민을 잘 들어주고, 함께 슬퍼하고 기뻐하는 다정한 친구랍니다.",
  INFJ: "상상력이 풍부한 **몽상가**예요. 조용하지만 마음속에는 큰 꿈을 품고 있어요. 다른 사람의 마음을 잘 이해하고, 따뜻한 마음으로 세상을 바라봐요. 창의적인 생각을 좋아하고, 예술적인 재능이 뛰어난 친구일 수도 있어요.",
  INTJ: "똑똑하고 전략적인 **천재**예요. 혼자 생각하는 걸 좋아하고, 논리적으로 문제를 해결하는 데 능숙해요. 새로운 아이디어를 떠올리는 걸 좋아하고, 목표를 세우면 꼭 이루려고 노력해요. 자신만의 세계가 뚜렷하고, 독립적인 친구랍니다.",
  ISTP: "손재주가 좋은 **만능 재주꾼**이에요. 직접 만지고 조작하는 걸 좋아하고, 기계나 도구를 다루는 데 능숙해요. 위험을 두려워하지 않고, 새로운 도전을 즐겨요. 겉으로는 무뚝뚝해 보이지만, 속으로는 따뜻한 마음을 가진 친구랍니다.",
  ISFP: "마음이 따뜻한 **예술가**예요. 그림 그리기, 음악 듣기 등 예술적인 활동을 좋아해요. 자유로운 영혼을 가지고 있고, 틀에 얽매이는 걸 싫어해요. 주변의 아름다움을 잘 발견하고, 감수성이 풍부한 친구랍니다.",
  INFP: "상상력이 풍부한 **낭만주의자**예요. 마음이 여리고, 다른 사람의 아픔을 잘 이해해요. 자신만의 독특한 세계를 가지고 있고, 창의적인 생각을 좋아해요. 글쓰기나 그림 그리기 등 예술적인 활동에 재능이 있을 수 있어요.",
  INTP: "호기심 많은 **발명가**예요. 새로운 아이디어를 떠올리는 걸 좋아하고, 논리적으로 생각하는 데 능숙해요. 혼자서 책을 읽거나 연구하는 걸 좋아하고, 지적인 호기심이 많아요. 엉뚱한 상상을 즐기고, 독특한 매력을 가진 친구랍니다.",
  ESTP: "에너지가 넘치는 **모험가**예요. 친구들과 함께 신나게 노는 걸 좋아하고, 새로운 경험을 즐겨요. 위험을 두려워하지 않고, 도전하는 걸 좋아해요. 운동을 잘하거나, 게임을 잘하는 친구일 수도 있어요.",
  ESFP: "인기 많은 **연예인**이에요. 사람들과 어울리는 걸 좋아하고, 분위기를 즐겁게 만드는 재주가 있어요. 춤추고 노래하는 걸 좋아하고, 주목받는 걸 즐겨요. 밝고 긍정적인 에너지를 가진 친구랍니다.",
  ENFP: "상상력이 풍부한 **자유로운 영혼**이에요. 새로운 아이디어를 떠올리는 걸 좋아하고, 창의적인 활동을 즐겨요. 친구들과 함께 웃고 떠드는 걸 좋아하고, 긍정적인 에너지를 뿜어내요. 어디로 튈지 모르는 매력을 가진 친구랍니다.",
  ENTP: "똑똑하고 재치 있는 **발명가**예요. 새로운 아이디어를 떠올리는 걸 좋아하고, 논리적으로 생각하는 데 능숙해요. 친구들과 토론하는 걸 즐기고, 지적인 호기심이 많아요. 엉뚱한 상상을 즐기고, 독특한 매력을 가진 친구랍니다.",
  ESTJ: "리더십이 강한 **관리자**예요. 규칙을 잘 지키고, 계획을 세우는 걸 좋아해요. 친구들을 잘 이끌고, 책임감이 강해요. 정리정돈을 잘하고, 깔끔한 걸 좋아하는 친구랍니다.",
  ESFJ: "친절하고 사교적인 **주최자**예요. 친구들을 챙겨주고, 함께 어울리는 걸 좋아해요. 다른 사람의 기분을 잘 알아차리고, 따뜻한 마음으로 배려해요. 친구들의 고민을 잘 들어주고, 함께 슬퍼하고 기뻐하는 다정한 친구랍니다.",
  ENFJ: "카리스마 넘치는 **리더**예요. 친구들을 잘 이끌고, 긍정적인 에너지를 뿜어내요. 다른 사람의 마음을 잘 이해하고, 따뜻한 마음으로 배려해요. 정의롭고, 친구들을 위해 희생할 줄 아는 멋진 친구랍니다.",
  ENTJ: "목표 지향적인 **지도자**예요. 똑똑하고, 목표를 세우면 꼭 이루려고 노력해요. 친구들을 잘 이끌고, 자신감이 넘쳐요. 새로운 아이디어를 떠올리는 걸 좋아하고, 창의적인 생각을 즐기는 친구랍니다.",
};

const ASSERTIVE_TURBULENT_DESCRIPTIONS = {
  "-A": "이에요. 자신감이 넘치고, 어떤 일이든 씩씩하게 해낼 수 있어요. 스트레스도 잘 이겨내고, 긍정적인 마음을 유지하는 편이에요.",
  "-T": "이에요. 꼼꼼하고 완벽하게 하려고 노력해요. 그래서 가끔은 걱정이 많을 때도 있지만, 항상 더 나아지려고 노력하는 멋진 친구랍니다.",
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
  progressBar: document.getElementById("progress-bar"),
};

const buttonClickSound = new Audio("button_click.mp3");
const resultSound = new Audio("result_sound.mp3");

let currentQuestion = 0;
let answers = [];
let selectedVersion = "simple";
let currentQuestions = [];

function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
}

function updateProgressBar() {
  const progress = (currentQuestion / currentQuestions.length) * 100;
  dom.progressBar.style.width = `${progress}%`;
}

function showQuestion() {
  if (currentQuestion < currentQuestions.length) {
    dom.questionNumberElement.textContent = `질문 ${currentQuestion + 1}`;
    dom.questionElement.textContent = currentQuestions[currentQuestion];
    updateProgressBar();
  } else {
    showResult();
  }
}

function answerQuestion(answer) {
  playSound(buttonClickSound);
  answers[currentQuestion] = answer ? 1 : 0;
  currentQuestion++;
  showQuestion();
}

function calculateMBTI() {
  let result = "";
  if (selectedVersion === "simple") {
    result += answers.slice(0, 5).reduce((a, b) => a + b) > 2 ? "E" : "I";
    result += answers.slice(5, 10).reduce((a, b) => a + b) > 2 ? "S" : "N";
    result += answers.slice(10, 15).reduce((a, b) => a + b) > 2 ? "T" : "F";
    result += answers.slice(15, 20).reduce((a, b) => a + b) > 2 ? "J" : "P";
    result += answers.slice(20, 25).reduce((a, b) => a + b) > 2 ? "-A" : "-T";
  } else {
    result += answers[0] ? "E" : "I";
    result += answers[1] ? "S" : "N";
    result += answers[2] ? "T" : "F";
    result += answers[3] ? "J" : "P";
    result += answers[4] ? "-A" : "-T";
  }
  return result;
}

function markdownToHTML(text) {
  text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  return text;
}

function getMBTIDescription(mbti) {
  const baseType = mbti.slice(0, 4);
  const assertiveTurbulent = mbti.slice(4);
  let description =
    BASE_DESCRIPTIONS[baseType] +
    ASSERTIVE_TURBULENT_DESCRIPTIONS[assertiveTurbulent];
  return markdownToHTML(description);
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
  dom.mbtiDescriptionElement.innerHTML = getMBTIDescription(mbti);
  setMBTIImage(mbti);
}

function restartTest() {
  playSound(buttonClickSound);
  currentQuestion = 0;
  answers = [];
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

  selectedVersion = document.querySelector(
    'input[name="version"]:checked'
  ).value;
  currentQuestions = QUESTIONS[selectedVersion];
  answers = new Array(currentQuestions.length).fill(0);
  showQuestion();
}

dom.yesButton.addEventListener("click", () => answerQuestion(true));
dom.noButton.addEventListener("click", () => answerQuestion(false));
dom.restartButton.addEventListener("click", restartTest);
dom.startButton.addEventListener("click", startTest);

dom.startScreen.style.display = "block";
document.getElementById("question-container").style.display = "none";
