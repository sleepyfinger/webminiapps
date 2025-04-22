const amount = document.getElementById("amount");
const fromCurrency = document.getElementById("from-currency");
const toCurrency = document.getElementById("to-currency");
const result = document.getElementById("result");
const convertBtn = document.getElementById("convert-btn");

async function getExchangeRate(fromCurrencyCode, toCurrencyCode) {
  const url = `https://m.search.naver.com/p/csearch/content/qapirender.nhn?key=calculator&pkid=141&q=%ED%99%98%EC%9C%A8&where=m&u1=keb&u6=standardUnit&u7=0&u3=${fromCurrencyCode}&u4=${toCurrencyCode}&u8=down&u2=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // JSON 응답에서 환율 정보 추출
    if (data && data.country && data.country.length > 1) {
      const rate = parseFloat(data.country[1].value.replace(",", ""));
      return rate; // 환율 반환
    } else {
      console.error("환율 정보를 찾을 수 없습니다.");
      return null;
    }
  } catch (error) {
    console.error("API 요청 중 오류 발생:", error);
    return null;
  }
}

async function calculateExchangeRate() {
  const amountValue = parseFloat(amount.value);
  const fromCurrencyValue = fromCurrency.value;
  const toCurrencyValue = toCurrency.value;

  if (isNaN(amountValue)) {
    alert("올바른 금액을 입력해주세요.");
    return;
  }

  if (fromCurrencyValue === toCurrencyValue) {
    result.value = amountValue.toFixed(2);
    return;
  }

  const exchangeRate = await getExchangeRate(
    fromCurrencyValue,
    toCurrencyValue
  );

  if (exchangeRate) {
    const convertedAmount = amountValue * exchangeRate;
    result.value = convertedAmount.toLocaleString("ko-KR", {
      maximumFractionDigits: 2,
    });
  } else {
    alert("환율 정보를 가져오는데 실패했습니다.");
  }
}

// 버튼 클릭 이벤트 리스너
convertBtn.addEventListener("click", calculateExchangeRate);
