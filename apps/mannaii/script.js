document
  .getElementById("ageCalculator")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const birthdate = new Date(document.getElementById("birthdate").value);
    const today = new Date();

    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthdate.getDate())
    ) {
      age--;
    }

    const resultDiv = document.getElementById("result");
    resultDiv.textContent = `만 나이: ${age}세`;
  });
