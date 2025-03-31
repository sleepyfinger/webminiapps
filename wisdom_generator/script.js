const quotes = [
  { quote: "성공은 준비된 자에게 찾아온다.", author: "알렉산더 그레이엄 벨" },
  {
    quote: "꿈을 이루는 가장 좋은 방법은 깨어 있는 것이다.",
    author: "말콤 포브스",
  },
  { quote: "실패는 성공으로 가는 디딤돌이다.", author: "토마스 에디슨" },
  {
    quote: "위대한 일은 작은 일들의 축적으로 이루어진다.",
    author: "빈센트 반 고흐",
  },
  { quote: "미래는 자신이 만드는 것이다.", author: "에이브러햄 링컨" },
  {
    quote: "삶은 영향을 주는 것이지, 돈을 버는 것이 아니다.",
    author: "케빈 크루즈",
  },
  {
    quote: "사람의 마음이 상상하고 믿을 수 있다면, 그것은 이룰 수 있다.",
    author: "나폴레옹 힐",
  },
  {
    quote: "결코 실수하지 않은 사람은 새로운 것을 시도해본 적이 없다.",
    author: "알버트 아인슈타인",
  },
  {
    quote: "성공하려면 실패에 대한 두려움보다 성공에 대한 욕망이 더 커야 한다.",
    author: "빌 코스비",
  },
  {
    quote: "가장 용기 있는 행동은 여전히 스스로 생각하는 것이다.",
    author: "코코 샤넬",
  },
  {
    quote: "행복은 우리가 가진 것에 감사하는 데서 온다.",
    author: "오프라 윈프리",
  },
  {
    quote: "변화는 당신의 생각을 바꾸는 데서 시작된다.",
    author: "노먼 빈센트 필",
  },
  { quote: "꿈을 크게 꾸고 실패를 두려워하지 마라.", author: "노먼 본" },
  {
    quote: "당신이 할 수 있는 일을 하라, 지금 있는 곳에서, 가진 것으로.",
    author: "시어도어 루즈벨트",
  },
  {
    quote:
      "성공한 전사는 보통 사람이지만, 레이저와 같은 집중력을 가진 사람이다.",
    author: "브루스 리",
  },
  { quote: "천 마일의 여정도 한 걸음에서 시작된다.", author: "노자" },
  {
    quote: "당신이 항상 하던 대로 하면, 항상 얻던 것을 얻게 될 것이다.",
    author: "토니 로빈스",
  },
  {
    quote: "모든 고난에는 동등하거나 더 큰 기회가 숨어 있다.",
    author: "나폴레옹 힐",
  },
  {
    quote: "교육은 세상을 변화시킬 수 있는 가장 강력한 무기다.",
    author: "넬슨 만델라",
  },
  {
    quote: "삶은 우리가 만드는 것이다, 항상 그래왔고, 항상 그럴 것이다.",
    author: "그랜드마 모세",
  },
  { quote: "꿈꾸는 것은 계획의 한 형태다.", author: "글로리아 스타이넘" },
  {
    quote: "너 자신이 되어라. 다른 사람은 이미 차지되었다.",
    author: "오스카 와일드",
  },
  {
    quote: "그것이 당신을 죽이지 않는다면, 당신을 더 강하게 만들 것이다.",
    author: "프리드리히 니체",
  },
  {
    quote: "당신이 할 수 있다고 믿으면 이미 반쯤 온 것이다.",
    author: "시어도어 루즈벨트",
  },
  { quote: "불가능은 단지 의견일 뿐이다.", author: "로빈 샤르마" },
  { quote: "웃음 없는 하루는 낭비된 하루다.", author: "찰리 채플린" },
  {
    quote:
      "성공은 최종적인 것이 아니고, 실패는 치명적인 것이 아니다. 중요한 것은 계속할 용기다.",
    author: "윈스턴 처칠",
  },
  { quote: "가장 어두운 밤도 끝나고 태양은 떠오른다", author: "빅토르 위고" },
  {
    quote:
      "인생은 자전거를 타는 것과 같다. 균형을 유지하려면 계속 움직여야 한다.",
    author: "알버트 아인슈타인",
  },
  { quote: "성공의 비결은 시작하는 것이다.", author: "마크 트웨인" },
  {
    quote: "당신이 할 수 있다고 생각하든, 할 수 없다고 생각하든, 당신은 옳다.",
    author: "헨리 포드",
  },
  {
    quote: "행복은 목적지가 아니라 여행의 방식이다.",
    author: "마가렛 리 런벡",
  },
  { quote: "인생은 짧다. 당신의 열정을 따르라.", author: "알렉스 헌터" },
  {
    quote:
      "가장 큰 영광은 결코 넘어지지 않는 데 있는 것이 아니라, 넘어질 때마다 일어서는 데 있다.",
    author: "공자",
  },
  {
    quote: "당신이 세상을 바꾸고 싶다면, 자신부터 바꾸어라.",
    author: "마하트마 간디",
  },
  {
    quote: "성공은 열정을 잃지 않고 실패에서 실패로 걸어가는 것이다.",
    author: "윈스턴 처칠",
  },
  {
    quote: "인생에서 가장 큰 위험은 아무 위험도 감수하지 않는 것이다.",
    author: "오프라 윈프리",
  },
  {
    quote: "당신이 꿈꿀 수 있다면, 당신은 그것을 이룰 수 있다.",
    author: "월트 디즈니",
  },
  {
    quote: "인생은 당신이 만드는 것이다. 당신의 꿈을 쫓으라.",
    author: "알렉스 헌터",
  },
  {
    quote:
      "성공은 우연이 아니다. 그것은 노력, 인내, 학습, 연구, 희생, 그리고 무엇보다도 당신이 하는 일에 대한 사랑이다.",
    author: "펠레",
  },
  {
    quote: "당신이 할 수 있는 가장 큰 모험은 당신의 꿈을 사는 것이다.",
    author: "오프라 윈프리",
  },
  {
    quote:
      "진정한 발견의 여정은 새로운 풍경을 찾는 것이 아니라, 새로운 눈을 가지는 것이다.",
    author: "마르셀 프루스트",
  },
  {
    quote: "인생은 용기 있는 모험이거나 아무것도 아니다.",
    author: "헬렌 켈러",
  },
  {
    quote:
      "자신을 믿어라. 당신은 당신이 생각하는 것보다 더 용감하고, 생각하는 것보다 더 재능 있고, 생각하는 것보다 더 능력이 있다.",
    author: "로이 T. 베넷",
  },
  {
    quote:
      "인생의 가장 큰 영광은 결코 넘어지지 않는 데 있는 것이 아니라, 넘어질 때마다 일어서는 데 있다.",
    author: "넬슨 만델라",
  },
  {
    quote: "당신이 할 수 있는 가장 큰 모험은 당신의 꿈을 사는 것이다.",
    author: "오프라 윈프리",
  },
  {
    quote: "성공은 열정을 잃지 않고 실패에서 실패로 걸어가는 것이다.",
    author: "윈스턴 처칠",
  },
  {
    quote: "인생에서 가장 큰 위험은 아무 위험도 감수하지 않는 것이다.",
    author: "오프라 윈프리",
  },
  {
    quote: "당신이 꿈꿀 수 있다면, 당신은 그것을 이룰 수 있다.",
    author: "월트 디즈니",
  },
  {
    quote: "인생은 당신이 만드는 것이다. 당신의 꿈을 쫓으라.",
    author: "알렉스 헌터",
  },
  {
    quote:
      "성공은 우연이 아니다. 그것은 노력, 인내, 학습, 연구, 희생, 그리고 무엇보다도 당신이 하는 일에 대한 사랑이다.",
    author: "펠레",
  },
  {
    quote: "당신이 할 수 있는 가장 큰 모험은 당신의 꿈을 사는 것이다.",
    author: "오프라 윈프리",
  },
  {
    quote:
      "성공은 최종적인 것이 아니고, 실패는 치명적인 것이 아니다. 중요한 것은 계속할 용기다.",
    author: "윈스턴 처칠",
  },
  {
    quote: "당신이 할 수 있다고 믿으면 이미 반쯤 온 것이다.",
    author: "시어도어 루즈벨트",
  },
  {
    quote: "인생은 당신이 만드는 것이다, 항상 그래왔고, 항상 그럴 것이다.",
    author: "그랜드마 모세",
  },
  {
    quote: "당신이 세상을 바꾸고 싶다면, 자신부터 바꾸어라.",
    author: "마하트마 간디",
  },
  {
    quote: "성공은 열정을 잃지 않고 실패에서 실패로 걸어가는 것이다.",
    author: "윈스턴 처칠",
  },
  {
    quote: "인생에서 가장 큰 위험은 아무 위험도 감수하지 않는 것이다.",
    author: "오프라 윈프리",
  },
  {
    quote: "당신이 꿈꿀 수 있다면, 당신은 그것을 이룰 수 있다.",
    author: "월트 디즈니",
  },
  {
    quote: "인생은 당신이 만드는 것이다. 당신의 꿈을 쫓으라.",
    author: "알렉스 헌터",
  },
  {
    quote:
      "성공은 우연이 아니다. 그것은 노력, 인내, 학습, 연구, 희생, 그리고 무엇보다도 당신이 하는 일에 대한 사랑이다.",
    author: "펠레",
  },
  {
    quote: "당신이 할 수 있는 가장 큰 모험은 당신의 꿈을 사는 것이다.",
    author: "오프라 윈프리",
  },
];

const quoteElement = document.getElementById("quote");
const authorElement = document.getElementById("author");
const newQuoteButton = document.getElementById("new-quote");

let lastQuoteIndex = -1;
let intervalId;

function getRandomQuote() {
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * quotes.length);
  } while (randomIndex === lastQuoteIndex);
  lastQuoteIndex = randomIndex;
  return quotes[randomIndex];
}

function displayQuote() {
  const { quote, author } = getRandomQuote();
  quoteElement.textContent = quote;
  authorElement.textContent = `- ${author}`;
}

function changeQuote() {
  displayQuote();
}

function startAutoChange() {
  newQuoteButton.classList.add("loading");
  changeQuote();

  clearTimeout(intervalId);
  intervalId = setTimeout(() => {
    newQuoteButton.classList.remove("loading");
    void newQuoteButton.offsetWidth;
    startAutoChange();
  }, 10000);
}

newQuoteButton.addEventListener("click", () => {
  newQuoteButton.classList.remove("loading");
  void newQuoteButton.offsetWidth;
  startAutoChange();
});

window.addEventListener("load", startAutoChange);
