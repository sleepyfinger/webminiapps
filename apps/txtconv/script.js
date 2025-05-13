const inputTextArea = document.getElementById("input-text");
const outputTextArea = document.getElementById("output-text");
const regexListContainer = document.getElementById("regex-list-container");
const regexItemsWrapper = document.getElementById("regex-items-wrapper");
const addPatternButton = document.getElementById("add-pattern-button");
const applyPatternsButton = document.getElementById("apply-patterns-button");
const savePatternsButton = document.getElementById("save-patterns-button");
const loadPatternsButton = document.getElementById("load-patterns-button");
const clearInputButton = document.getElementById("clear-input-button");
const copyOutputButton = document.getElementById("copy-output-button");
const exportJsonClipboardButton = document.getElementById("export-json-clipboard-button");
const importJsonClipboardButton = document.getElementById("import-json-clipboard-button");

const jsonImportModal = document.getElementById("json-import-modal");
const jsonImportTextarea = document.getElementById("json-import-textarea");
const applyJsonFromModalButton = document.getElementById("apply-json-from-modal-button");
const modalCloseButton = document.querySelector(".modal-close-button");


let regexPatterns = [];

function renderPatterns() {
  regexItemsWrapper.innerHTML = "";

  regexPatterns.forEach((patternData, index) => {
    const row = document.createElement("div");
    row.className = "regex-row";
    row.dataset.index = index;

    const dragHandle = document.createElement("span");
    dragHandle.className = "drag-handle";
    dragHandle.title = "드래그하여 순서 변경";
    dragHandle.setAttribute("aria-grabbed", "false");
    row.appendChild(dragHandle);

    const actionSelect = document.createElement("select");
    const actions = {
      replace: "바꾸기",
      deleteLine: "패턴 라인 삭제",
      trimTrailingWhitespace: "라인 끝 공백 제거",
    };
    for (const [value, text] of Object.entries(actions)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      actionSelect.appendChild(option);
    }
    actionSelect.value = patternData.action || "replace";

    const patternWrapper = document.createElement("div");
    patternWrapper.className = "regex-input-wrapper";
    const patternInput = document.createElement("input");
    patternInput.type = "text";
    patternInput.placeholder = "/패턴/플래그";
    patternInput.value = patternData.pattern || "";
    patternWrapper.appendChild(patternInput);

    const replaceWrapper = document.createElement("div");
    replaceWrapper.className = "regex-input-wrapper";
    const replaceInput = document.createElement("input");
    replaceInput.type = "text";
    replaceInput.placeholder = "대체 문자열";
    replaceInput.value = patternData.replace || "";
    replaceWrapper.appendChild(replaceInput);

    const updateVisibility = (selectedAction) => {
      replaceInput.style.display = selectedAction === "replace" ? "" : "none";
      patternInput.style.display =
        selectedAction !== "trimTrailingWhitespace" ? "" : "none";
      if (selectedAction === "trimTrailingWhitespace") {
        patternInput.value = "";
      }
    };

    actionSelect.addEventListener("change", (e) => {
      const newAction = e.target.value;
      updateVisibility(newAction);
    });

    updateVisibility(actionSelect.value);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "삭제";
    deleteButton.className = "delete-pattern-button";

    row.appendChild(actionSelect);
    row.appendChild(patternWrapper);
    row.appendChild(replaceWrapper);
    row.appendChild(deleteButton);
    regexItemsWrapper.appendChild(row);
  });
}

function addPatternRow() {
  regexPatterns.push({ pattern: "", replace: "", action: "replace" });
  renderPatterns();
}

function deletePattern(index) {
  if (index >= 0 && index < regexPatterns.length) {
    regexPatterns.splice(index, 1);
    renderPatterns();
  } else {
    console.error("Invalid index for deletion:", index);
  }
}

function getPatternsFromDOM() {
  const currentPatterns = [];
  const rows = regexItemsWrapper.querySelectorAll(".regex-row");
  rows.forEach((row) => {
    const actionSelect = row.querySelector("select");
    const patternInput = row.querySelector(
      ".regex-input-wrapper input[placeholder='/패턴/플래그']"
    );
    const replaceInput = row.querySelector(
      ".regex-input-wrapper input[placeholder='대체 문자열']"
    );
    currentPatterns.push({
      action: actionSelect ? actionSelect.value : "replace",
      pattern: patternInput ? patternInput.value : "",
      replace: replaceInput ? replaceInput.value : "",
    });
  });
  return currentPatterns;
}

function savePatterns(showAlert = true) {
  const currentDOMPatterns = getPatternsFromDOM();
  regexPatterns = currentDOMPatterns;
  localStorage.setItem("regexPatterns", JSON.stringify(regexPatterns));
  if (showAlert) {
    alert("패턴 목록이 저장되었습니다.");
  }
}

function loadPatterns() {
  const savedPatterns = localStorage.getItem("regexPatterns");
  if (savedPatterns) {
    try {
      let loadedData = JSON.parse(savedPatterns);
      if (!Array.isArray(loadedData)) {
        console.error("Loaded patterns are not an array, resetting.");
        regexPatterns = [{ pattern: "", replace: "", action: "replace" }];
      } else {
        regexPatterns = loadedData.filter(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof item.action === "string" &&
            typeof item.pattern === "string" &&
            typeof item.replace === "string"
        );
        if (regexPatterns.length === 0 && loadedData.length > 0) {
          console.warn("Loaded patterns were filtered out due to invalid format. Using default.");
          regexPatterns = [{ pattern: "", replace: "", action: "replace" }];
        } else if (regexPatterns.length === 0) {
          regexPatterns.push({ pattern: "", replace: "", action: "replace" });
        }
      }
    } catch (e) {
      console.error("Failed to parse saved patterns, resetting.", e);
      regexPatterns = [{ pattern: "", replace: "", action: "replace" }];
    }
  } else {
    regexPatterns = [{ pattern: "", replace: "", action: "replace" }];
  }
  renderPatterns();
}

function applyAllPatterns() {
  const inputText = inputTextArea.value;
  let currentText = inputText;

  if (!inputText.trim()) {
    outputTextArea.value = "";
    return;
  }

  try {
    const patternsToApply = getPatternsFromDOM();
    for (const patternData of patternsToApply) {
      const action = patternData.action || "replace";
      const patternString = patternData.pattern;
      const replacement = patternData.replace || "";

      if (action === "replace" || action === "deleteLine") {
        if (action === "deleteLine" && (!patternString || !patternString.trim())) {
          console.warn("Skipping 'deleteLine' rule with empty pattern:", patternData);
          continue;
        }
        if (action === "replace" && !patternString && replacement) {
        }

        const match = patternString.match(/^\/(.*)\/([gimyus]*)$/s);
        if (!match && (patternString || action === "deleteLine")) {
          throw new Error(
            `잘못된 형식의 패턴: "${patternString}". /패턴/플래그 형식이어야 합니다.`
          );
        }
        const regexPattern = match ? match[1] : "";
        const regexFlags = match ? match[2] : "";

        if (!patternString && action !== "replace") {
          continue;
        }

        const regex = new RegExp(regexPattern, regexFlags);

        if (action === "replace") {
          currentText = currentText.replace(regex, replacement);
        } else if (action === "deleteLine") {
          const lines = currentText.split("\n");
          const filteredLines = lines.filter((line) => !regex.test(line));
          currentText = filteredLines.join("\n");
        }
      } else if (action === "trimTrailingWhitespace") {
        const lines = currentText.split("\n");
        currentText = lines.map((line) => line.trimEnd()).join("\n");
      }
    }
    outputTextArea.value = currentText;
  } catch (error) {
    outputTextArea.value = `오류: ${error.message}`;
    console.error("Error applying patterns:", error);
  }
}

if (exportJsonClipboardButton) {
  exportJsonClipboardButton.addEventListener('click', async () => {
    const patternsToExport = getPatternsFromDOM();
    if (patternsToExport.length === 0) {
      alert('내보낼 패턴이 없습니다.');
      return;
    }
    const jsonString = JSON.stringify(patternsToExport, null, 2);
    try {
      await navigator.clipboard.writeText(jsonString);
      alert('패턴 목록이 JSON 형식으로 클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      alert('클립보드 복사에 실패했습니다. 콘솔을 확인해주세요.');
      prompt("클립보드 복사에 실패했습니다. 아래 내용을 직접 복사하세요:", jsonString);
    }
  });
}

function processAndApplyJsonPatterns(jsonString) {
  if (!jsonString) {
    alert('붙여넣을 JSON 내용이 없습니다.');
    return;
  }
  try {
    const patternsToImport = JSON.parse(jsonString);

    if (!Array.isArray(patternsToImport)) {
      alert('잘못된 JSON 형식입니다. 패턴 목록은 배열이어야 합니다.');
      return;
    }

    const validPatterns = [];
    let invalidPatternFound = false;
    patternsToImport.forEach(pattern => {
      if (
        pattern &&
        typeof pattern.action === 'string' &&
        typeof pattern.pattern === 'string' &&
        typeof pattern.replace === 'string'
      ) {
        validPatterns.push(pattern);
      } else {
        console.warn('잘못된 형식의 패턴 객체를 건너뜁니다:', pattern);
        invalidPatternFound = true;
      }
    });

    if (invalidPatternFound) {
      alert('일부 패턴이 잘못된 형식이어서 제외되었습니다. 콘솔을 확인하세요.');
    }

    if (validPatterns.length > 0) {
      regexPatterns = validPatterns;
      renderPatterns();
      alert(`패턴 목록을 JSON에서 성공적으로 가져왔습니다. (${validPatterns.length}개 적용)`);
    } else if (!invalidPatternFound) {
      alert('가져올 유효한 패턴이 없습니다.');
    }

  } catch (err) {
    console.error('JSON 파싱 또는 패턴 적용 실패:', err);
    alert('JSON 파싱에 실패했거나 잘못된 형식의 데이터입니다. 콘솔을 확인해주세요.');
  }
}

if (importJsonClipboardButton) {
  importJsonClipboardButton.addEventListener('click', async () => {
    if (jsonImportModal && jsonImportTextarea) {
      jsonImportModal.style.display = "block";
      jsonImportTextarea.value = '';
      jsonImportTextarea.focus();
    }
  });
}

if (modalCloseButton) {
  modalCloseButton.addEventListener('click', () => {
    if (jsonImportModal) jsonImportModal.style.display = "none";
  });
}

if (applyJsonFromModalButton) {
  applyJsonFromModalButton.addEventListener('click', () => {
    processAndApplyJsonPatterns(jsonImportTextarea.value);
    if (jsonImportModal) jsonImportModal.style.display = "none";
  });
}

addPatternButton.addEventListener("click", addPatternRow);
applyPatternsButton.addEventListener("click", applyAllPatterns);
savePatternsButton.addEventListener("click", () => savePatterns(true));
loadPatternsButton.addEventListener("click", loadPatterns);

clearInputButton.addEventListener("click", () => {
  inputTextArea.value = "";
  outputTextArea.value = "";
});

copyOutputButton.addEventListener("click", () => {
  const textToCopy = outputTextArea.value;
  if (
    !textToCopy ||
    textToCopy.startsWith("오류:")
  ) {
    alert("복사할 유효한 내용이 없습니다.");
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        const originalText = copyOutputButton.textContent;
        copyOutputButton.textContent = "복사됨!";
        copyOutputButton.disabled = true;
        setTimeout(() => {
          copyOutputButton.textContent = originalText;
          copyOutputButton.disabled = false;
        }, 1500);
      })
      .catch((err) => {
        console.error("클립보드 복사 실패 (navigator):", err);
        tryCopyExecCommand(textToCopy);
      });
  } else {
    tryCopyExecCommand(textToCopy);
  }
});

function tryCopyExecCommand(textToCopy) {
  const textArea = document.createElement("textarea");
  textArea.value = textToCopy;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    const originalText = copyOutputButton.textContent;
    copyOutputButton.textContent = "복사됨!";
    copyOutputButton.disabled = true;
    setTimeout(() => {
      copyOutputButton.textContent = originalText;
      copyOutputButton.disabled = false;
    }, 1500);
  } catch (err) {
    console.error('클립보드 복사 실패 (execCommand):', err);
    alert('텍스트 복사에 실패했습니다. 브라우저가 지원하지 않거나 권한이 없을 수 있습니다.');
  }
  document.body.removeChild(textArea);
}

regexListContainer.addEventListener("click", (event) => {
  if (event.target.classList.contains("delete-pattern-button")) {
    const rowElement = event.target.closest(".regex-row");
    if (rowElement && rowElement.dataset.index) {
      const indexToDelete = parseInt(rowElement.dataset.index, 10);
      deletePattern(indexToDelete);
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const helpToggle = document.querySelector(
    ".regex-help-examples .collapsible-header"
  );
  const helpContainer = document.querySelector(".regex-help-examples");

  if (helpToggle && helpContainer) {
    helpToggle.addEventListener("click", () => {
      helpContainer.classList.toggle("collapsed");
    });
  }

  window.addEventListener('click', (event) => {
    if (event.target === jsonImportModal) {
      jsonImportModal.style.display = "none";
    }
  });

  loadPatterns();

  if (typeof Sortable !== "undefined") {
    new Sortable(regexItemsWrapper, {
      animation: 150,
      handle: ".drag-handle",
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      onUpdate: function (evt) {
        const oldIndex = evt.oldIndex;
        const newIndex = evt.newIndex;

        const movedItem = regexPatterns.splice(oldIndex, 1)[0];
        regexPatterns.splice(newIndex, 0, movedItem);

        const rows = regexItemsWrapper.querySelectorAll(".regex-row");
        rows.forEach((row, index) => {
          row.dataset.index = index;
        });
      },
    });
  } else {
    console.error(
      "SortableJS library not found. Drag and drop reordering will not work."
    );
  }
});
