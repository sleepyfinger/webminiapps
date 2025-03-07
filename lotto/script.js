document.addEventListener("DOMContentLoaded", () => {
  const lottoNumbers = document.getElementById("lotto-numbers");
  const generateBtn = document.getElementById("generate-btn");
  const numCountSlider = document.getElementById("num-count-slider");
  const numRangeSlider = document.getElementById("num-range-slider");
  const numCountValue = document.getElementById("num-count-value");
  const numRangeValue = document.getElementById("num-range-value");
  let lottoData = [];

  numCountValue.textContent = numCountSlider.value;
  numRangeValue.textContent = numRangeSlider.value;

  fetch("lotto.csv")
    .then((response) => response.text())
    .then((data) => {
      lottoData = data
        .split("\n")
        .slice(1)
        .map((row) => {
          const [round, ...numbers] = row.split(",");
          return {
            round: parseInt(round),
            numbers: numbers.slice(0, 6).map(Number),
            bonus: Number(numbers[6]),
          };
        });
    });

  function generateLottoNumbers(count, range) {
    const numbers = new Set();
    while (numbers.size < count) {
      numbers.add(Math.floor(Math.random() * range) + 1);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  }

  function displayNumbers(numbers) {
    lottoNumbers.innerHTML = "";
    let delay = 0;
    numbers.forEach((number, index) => {
      const numberElement = document.createElement("div");
      numberElement.classList.add("number");
      numberElement.textContent = number;
      numberElement.style.opacity = 0;
      numberElement.style.transform = "translateY(-20px)";

      numberElement.style.transition = `opacity 0.5s ease-in-out, transform 0.5s ease-in-out`;
      numberElement.style.transitionDelay = `${delay}s`;

      lottoNumbers.appendChild(numberElement);

      setTimeout(() => {
        numberElement.style.opacity = 1;
        numberElement.style.transform = "translateY(0)";
      }, 10);

      delay += 0.2;
    });
  }

  function checkWinning(generatedNumbers) {
    // 등수 계산은 번호 개수가 6개이고 범위가 45일 때만 실행
    if (numCountSlider.value !== "6" || numRangeSlider.value !== "45") {
      document.getElementById("result-grid").style.display = "none";
      return;
    }

    let winningCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    lottoData.forEach((lotto) => {
      const matchCount = generatedNumbers.filter((num) =>
        lotto.numbers.includes(num)
      ).length;

      if (matchCount === 6) winningCounts[1]++;
      else if (matchCount === 5 && generatedNumbers.includes(lotto.bonus))
        winningCounts[2]++;
      else if (matchCount === 5) winningCounts[3]++;
      else if (matchCount === 4) winningCounts[4]++;
      else if (matchCount === 3) winningCounts[5]++;
    });

    document.getElementById("first-place").textContent = winningCounts[1];
    document.getElementById("second-place").textContent = winningCounts[2];
    document.getElementById("third-place").textContent = winningCounts[3];
    document.getElementById("fourth-place").textContent = winningCounts[4];
    document.getElementById("fifth-place").textContent = winningCounts[5];
    document.getElementById("result-grid").style.display = "grid";
  }

  generateBtn.addEventListener("click", () => {
    // 슬라이더 값 가져오기
    const numCount = parseInt(numCountSlider.value);
    const numRange = parseInt(numRangeSlider.value);

    // 로또 번호 생성
    const numbers = generateLottoNumbers(numCount, numRange);
    displayNumbers(numbers);

    // 번호가 6개고 범위가 45인경우 등수 체크
    checkWinning(numbers);
  });

  // 슬라이더 이벤트 리스너 추가
  numCountSlider.addEventListener("input", () => {
    numCountValue.textContent = numCountSlider.value;
  });

  numRangeSlider.addEventListener("input", () => {
    numRangeValue.textContent = numRangeSlider.value;
  });
});
