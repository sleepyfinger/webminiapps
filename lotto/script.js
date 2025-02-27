document.addEventListener("DOMContentLoaded", () => {
  const lottoNumbers = document.getElementById("lotto-numbers");
  const generateBtn = document.getElementById("generate-btn");
  const resultDiv = document.getElementById("result");
  let lottoData = [];

  // CSV 파일 로드
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

  function generateLottoNumbers() {
    const numbers = new Set();
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  }

  function displayNumbers(numbers) {
    lottoNumbers.innerHTML = "";
    numbers.forEach((number) => {
      const numberElement = document.createElement("div");
      numberElement.classList.add("number");
      numberElement.textContent = number;
      lottoNumbers.appendChild(numberElement);
    });
  }

  function checkWinning(generatedNumbers) {
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

    let result = "";
    for (let i = 1; i <= 5; i++) {
      result += `${i}등: ${winningCounts[i]}회<br>`;
    }
    return result || "당첨되지 않았습니다.";
  }

  generateBtn.addEventListener("click", () => {
    const numbers = generateLottoNumbers();
    displayNumbers(numbers);
    const winningResult = checkWinning(numbers);
    resultDiv.innerHTML = winningResult;
  });
});
