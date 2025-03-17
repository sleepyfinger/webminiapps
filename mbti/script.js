const questions = [
  "당신은 새로운 사람들을 만나는 것을 즐기나요?",
  "계획을 세우는 것을 좋아하나요?",
  "추상적인 아이디어에 관심이 많나요?",
  "감정적인 결정을 자주 하나요?",
];

let currentQuestion = 0;
let answers = [];

const questionElement = document.getElementById("question");
const yesButton = document.getElementById("yes");
const noButton = document.getElementById("no");
const resultElement = document.getElementById("result");
const mbtiResultElement = document.getElementById("mbti-result");

function showQuestion() {
  if (currentQuestion < questions.length) {
    questionElement.textContent = questions[currentQuestion];
  } else {
    showResult();
  }
}

function answerQuestion(answer) {
  answers.push(answer);
  currentQuestion++;
  showQuestion();
}

function showResult() {
  const questionContainer = document.getElementById("question-container");
  questionContainer.style.display = "none";
  resultElement.style.display = "block";

  const mbti = calculateMBTI();
  mbtiResultElement.textContent = mbti;
}

function calculateMBTI() {
  const types = ["E", "I", "S", "N", "T", "F", "J", "P"];
  let result = "";

  result += answers[0] ? "E" : "I";
  result += answers[1] ? "J" : "P";
  result += answers[2] ? "N" : "S";
  result += answers[3] ? "F" : "T";

  return result;
}

yesButton.addEventListener("click", () => answerQuestion(true));
noButton.addEventListener("click", () => answerQuestion(false));

showQuestion();
