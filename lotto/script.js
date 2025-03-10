document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generate-btn");
  const lottoNumbersContainer = document.getElementById(
    "lotto-numbers-container"
  );
  const numSetSlider = document.getElementById("num-set-slider");
  const numCountSlider = document.getElementById("num-count-slider");
  const numRangeSlider = document.getElementById("num-range-slider");
  const numCountValue = document.getElementById("num-count-value");
  const numRangeValue = document.getElementById("num-range-value");
  const showResultCheckbox = document.getElementById("show-result");
  const resultGrid = document.getElementById("result-grid");
  const numSetValue = document.getElementById("num-set-value");
  const firstPlaceDiv = document.getElementById("first-place");
  const secondPlaceDiv = document.getElementById("second-place");
  const thirdPlaceDiv = document.getElementById("third-place");
  const fourthPlaceDiv = document.getElementById("fourth-place");
  const fifthPlaceDiv = document.getElementById("fifth-place");

  let lottoData = [];

  numCountValue.textContent = numCountSlider.value;
  numRangeValue.textContent = numRangeSlider.value;
  numSetValue.textContent = numSetSlider.value;

  if (!showResultCheckbox.checked) {
    resultGrid.style.display = "none";
  }

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

  numSetSlider.addEventListener("input", () => {
    numSetValue.textContent = numSetSlider.value;
  });

  function generateLottoNumbers(count, range) {
    const numbers = new Set();
    while (numbers.size < count) {
      numbers.add(Math.floor(Math.random() * range) + 1);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  }

  function displayLottoNumbers(numbers, setNum) {
    const setDiv = document.createElement("div");
    setDiv.classList.add("lotto-set");

    let delay = 0;
    numbers.forEach((number) => {
      const numberSpan = document.createElement("span");
      numberSpan.textContent = number;
      numberSpan.classList.add("lotto-number");
      numberSpan.style.opacity = 0;
      numberSpan.style.transform = "translateY(-20px)";
      numberSpan.style.transition = `opacity 0.5s ease-in-out, transform 0.5s ease-in-out`;
      numberSpan.style.transitionDelay = `${delay}s`;
      setDiv.appendChild(numberSpan);
      setTimeout(() => {
        numberSpan.style.opacity = 1;
        numberSpan.style.transform = "translateY(0)";
      }, 10);
      delay += 0.2;
    });
    lottoNumbersContainer.appendChild(setDiv);
  }

  function checkWinning(generatedNumbersArray) {
    if (!showResultCheckbox.checked) {
      resultGrid.style.display = "none";
      return;
    }

    if (numCountSlider.value !== "6") {
      resultGrid.style.display = "none";
      return;
    }

    let winningCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    generatedNumbersArray.forEach((generatedNumbers) => {
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
    });

    firstPlaceDiv.textContent = winningCounts[1];
    secondPlaceDiv.textContent = winningCounts[2];
    thirdPlaceDiv.textContent = winningCounts[3];
    fourthPlaceDiv.textContent = winningCounts[4];
    fifthPlaceDiv.textContent = winningCounts[5];
    resultGrid.style.display = "grid";
  }

  generateBtn.addEventListener("click", () => {
    const numSets = parseInt(numSetSlider.value);
    lottoNumbersContainer.innerHTML = ""; // 기존 내용 초기화
    const allLottoNumbers = []; // 모든 세트의 로또 번호를 담을 배열

    for (let i = 0; i < numSets; i++) {
      const lottoNumbers = generateLottoNumbers(
        parseInt(numCountSlider.value),
        parseInt(numRangeSlider.value)
      );
      displayLottoNumbers(lottoNumbers, i);
      allLottoNumbers.push(lottoNumbers); // 생성된 로또 번호를 배열에 추가
    }

    checkWinning(allLottoNumbers);
  });

  // 슬라이더 이벤트 리스너 추가
  numCountSlider.addEventListener("input", () => {
    numCountValue.textContent = numCountSlider.value;
  });

  numRangeSlider.addEventListener("input", () => {
    numRangeValue.textContent = numRangeSlider.value;
  });
});
