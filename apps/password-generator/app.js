const passwordEl = document.getElementById("password-output");
const lengthEl = document.getElementById("length");
const lengthValueEl = document.getElementById("length-value");
const uppercaseEl = document.getElementById("uppercase");
const lowercaseEl = document.getElementById("lowercase");
const numbersEl = document.getElementById("numbers");
const symbolsEl = document.getElementById("symbols");
const generateBtn = document.getElementById("generate-btn");
const copyBtn = document.getElementById("copy-btn");

const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
const numberChars = "0123456789";
const symbolChars = "!@#$%^&*()_+[]{}|;:,.<>?";

function generatePassword() {
  let chars = "";
  let password = "";

  if (uppercaseEl.checked) chars += uppercaseChars;
  if (lowercaseEl.checked) chars += lowercaseChars;
  if (numbersEl.checked) chars += numberChars;
  if (symbolsEl.checked) chars += symbolChars;

  if (chars === "") {
    alert("최소한 하나의 문자 유형을 선택하세요.");
    return;
  }

  for (let i = 0; i < lengthEl.value; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  passwordEl.value = password;
}

function copyPassword() {
  passwordEl.select();
  document.execCommand("copy");
  alert("비밀번호가 클립보드에 복사되었습니다!");
}

generateBtn.addEventListener("click", generatePassword);
copyBtn.addEventListener("click", copyPassword);
lengthEl.addEventListener("input", () => {
  lengthValueEl.textContent = lengthEl.value;
});

// generatePassword();
