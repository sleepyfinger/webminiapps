// DOM이 완전히 로드된 후 실행될 함수를 등록
document.addEventListener("DOMContentLoaded", () => {
  // HTML 요소 선택
  const lottoNumbers = document.getElementById("lotto-numbers");
  const generateBtn = document.getElementById("generate-btn");

  // 로또 번호 생성 함수
  function generateLottoNumbers() {
    const numbers = new Set();
    // 중복되지 않는 6개의 숫자가 생성될 때까지 반복
    while (numbers.size < 6) {
      // 1부터 45 사이의 랜덤한 정수 생성 및 추가
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    // Set을 배열로 변환하고 오름차순으로 정렬하여 반환
    return Array.from(numbers).sort((a, b) => a - b);
  }

  // 생성된 번호를 화면에 표시하는 함수
  function displayNumbers(numbers) {
    // 기존에 표시된 번호들을 모두 제거
    lottoNumbers.innerHTML = "";

    numbers.forEach((number) => {
      // 새로운 div 요소 생성
      const numberElement = document.createElement("div");
      // 생성된 div에 'number' 클래스 추가
      numberElement.classList.add("number");
      numberElement.textContent = number;
      // 생성된 div를 lottoNumbers 요소의 자식으로 추가
      lottoNumbers.appendChild(numberElement);
    });
  }

  // '번호 생성' 버튼에 클릭 이벤트 리스너 추가
  generateBtn.addEventListener("click", () => {
    const numbers = generateLottoNumbers();
    displayNumbers(numbers);
  });
});
