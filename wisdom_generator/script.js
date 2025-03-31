const quotes = [
  { quote: "성공은 준비된 자에게 찾아온다.", author: "알렉산더 그레이엄 벨" },
  {
    quote: "꿈을 이루는 가장 좋은 방법은 깨어 있는 것이다.",
    author: "말콤 포브스",
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
