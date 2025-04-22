document.addEventListener("DOMContentLoaded", () => {
  const screenshotFileInput = document.getElementById("screenshotFile");
  const deviceFrameSelect = document.getElementById("deviceFrame");
  const resetButton = document.getElementById("resetButton");
  const undoButton = document.getElementById("undoButton");
  const redoButton = document.getElementById("redoButton");

  const screenXInput = document.getElementById("screenX");
  const screenYInput = document.getElementById("screenY");
  const screenWidthInput = document.getElementById("screenWidth");
  const screenHeightInput = document.getElementById("screenHeight");
  const screenScaleInput = document.getElementById("screenScale");
  const borderRadiusInput = document.getElementById("borderRadius");
  const screenXRange = document.getElementById("screenXRange");
  const screenYRange = document.getElementById("screenYRange");
  const screenWidthRange = document.getElementById("screenWidthRange");
  const screenHeightRange = document.getElementById("screenHeightRange");
  const screenScaleRange = document.getElementById("screenScaleRange");
  const borderRadiusRange = document.getElementById("borderRadiusRange");

  const frameXInput = document.getElementById("frameX");
  const frameYInput = document.getElementById("frameY");
  const frameWidthInput = document.getElementById("frameWidth");
  const frameHeightInput = document.getElementById("frameHeight");
  const frameScaleInput = document.getElementById("frameScale");
  const frameXRange = document.getElementById("frameXRange");
  const frameYRange = document.getElementById("frameYRange");
  const frameWidthRange = document.getElementById("frameWidthRange");
  const frameHeightRange = document.getElementById("frameHeightRange");
  const frameScaleRange = document.getElementById("frameScaleRange");

  const backgroundColorInput = document.getElementById("backgroundColor");
  const titleTextInput = document.getElementById("titleText");
  const subtitleTextInput = document.getElementById("subtitleText");
  const textColorInput = document.getElementById("textColor");
  const fontFamilySelect = document.getElementById("fontFamily");
  const fontSizeInput = document.getElementById("fontSize");
  const textYOffsetInput = document.getElementById("textYOffset");
  const fontSizeRange = document.getElementById("fontSizeRange");
  const textYOffsetRange = document.getElementById("textYOffsetRange");

  const canvas = document.getElementById("previewCanvas");
  const downloadButton = document.getElementById("downloadButton");
  const ctx = canvas.getContext("2d");

  let screenshotImage = null;
  let currentFrameImage = null;
  let currentFrameSrc = null;

  const deviceFramesDefaults = {
    type_01: {
      src: "frames/type_01.png",
      canvasWidth: 810,
      canvasHeight: 1440,
      screenX: 94,
      screenY: 188,
      screenWidth: 623,
      screenHeight: 1255,
      screenScale: 1,
      borderRadius: 55,
      frameX: 0,
      frameY: 0,
      frameWidth: 810,
      frameHeight: 1440,
      frameScale: 1,
    },
    type_02: {
      src: "frames/type_02.png",
      canvasWidth: 810,
      canvasHeight: 1440,
      screenX: 94,
      screenY: 188,
      screenWidth: 623,
      screenHeight: 1255,
      screenScale: 1,
      borderRadius: 55,
      frameX: 0,
      frameY: 0,
      frameWidth: 810,
      frameHeight: 1440,
      frameScale: 1,
    },
    type_03: {
      src: "frames/type_03.png",
      canvasWidth: 1024,
      canvasHeight: 1366,
      screenX: 75,
      screenY: 100,
      screenWidth: 874,
      screenHeight: 1166,
      screenScale: 1,
      borderRadius: 22,
      frameX: 0,
      frameY: 0,
      frameWidth: 1024,
      frameHeight: 1366,
      frameScale: 1,
    },
    type_04: {
      src: "frames/type_04.png",
      canvasWidth: 1024,
      canvasHeight: 1366,
      screenX: 75,
      screenY: 100,
      screenWidth: 874,
      screenHeight: 1166,
      screenScale: 1,
      borderRadius: 22,
      frameX: 0,
      frameY: 0,
      frameWidth: 1024,
      frameHeight: 1366,
      frameScale: 1,
    },
  };
  const textDefaults = {
    fontFamily: "Arial, sans-serif",
    fontSize: 50,
    textYOffset: 80,
    subtitleFontSizeRatio: 0.6,
    subtitleLineHeightRatio: 1.2,
  };

  let history = [];
  let historyIndex = -1;
  const MAX_HISTORY = 50;
  let isApplyingState = false;

  function getCurrentState() {
    return {
      deviceFrame: deviceFrameSelect.value,
      screenX: screenXInput.value,
      screenY: screenYInput.value,
      screenWidth: screenWidthInput.value,
      screenHeight: screenHeightInput.value,
      screenScale: screenScaleInput.value,
      borderRadius: borderRadiusInput.value,
      frameX: frameXInput.value,
      frameY: frameYInput.value,
      frameWidth: frameWidthInput.value,
      frameHeight: frameHeightInput.value,
      frameScale: frameScaleInput.value,
      backgroundColor: backgroundColorInput.value,
      titleText: titleTextInput.value,
      subtitleText: subtitleTextInput.value,
      textColor: textColorInput.value,
      fontFamily: fontFamilySelect.value,
      fontSize: fontSizeInput.value,
      textYOffset: textYOffsetInput.value,
    };
  }

  function applyState(state, redraw = true) {
    if (!state) return;
    isApplyingState = true;

    const deviceChanged = deviceFrameSelect.value !== state.deviceFrame;

    deviceFrameSelect.value = state.deviceFrame;
    screenXInput.value = state.screenX;
    screenYInput.value = state.screenY;
    screenWidthInput.value = state.screenWidth;
    screenHeightInput.value = state.screenHeight;
    screenScaleInput.value = state.screenScale;
    borderRadiusInput.value = state.borderRadius;
    frameXInput.value = state.frameX;
    frameYInput.value = state.frameY;
    frameWidthInput.value = state.frameWidth;
    frameHeightInput.value = state.frameHeight;
    frameScaleInput.value = state.frameScale;
    backgroundColorInput.value = state.backgroundColor;
    titleTextInput.value = state.titleText;
    subtitleTextInput.value = state.subtitleText;
    textColorInput.value = state.textColor;
    fontFamilySelect.value = state.fontFamily;
    fontSizeInput.value = state.fontSize;
    textYOffsetInput.value = state.textYOffset;

    screenXRange.value = state.screenX;
    screenYRange.value = state.screenY;
    screenWidthRange.value = state.screenWidth;
    screenHeightRange.value = state.screenHeight;
    screenScaleRange.value = state.screenScale;
    borderRadiusRange.value = state.borderRadius;
    frameXRange.value = state.frameX;
    frameYRange.value = state.frameY;
    frameWidthRange.value = state.frameWidth;
    frameHeightRange.value = state.frameHeight;
    frameScaleRange.value = state.frameScale;
    fontSizeRange.value = state.fontSize;
    textYOffsetRange.value = state.textYOffset;

    if (redraw) {
      if (deviceChanged) {
        currentFrameImage = null;
        currentFrameSrc = null;
      }
      drawCanvas();
    }

    isApplyingState = false;
  }

  function saveHistory() {
    if (isApplyingState) return;

    const currentState = getCurrentState();

    if (
      historyIndex >= 0 &&
      JSON.stringify(currentState) === JSON.stringify(history[historyIndex])
    ) {
      return;
    }

    history = history.slice(0, historyIndex + 1);
    history.push(currentState);

    if (history.length > MAX_HISTORY) {
      history.shift();
    }

    historyIndex = history.length - 1;
    updateUndoRedoButtons();
  }

  function undo() {
    if (historyIndex > 0) {
      historyIndex--;
      applyState(history[historyIndex]);
      updateUndoRedoButtons();
    }
  }

  function redo() {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      applyState(history[historyIndex]);
      updateUndoRedoButtons();
    }
  }

  function updateUndoRedoButtons() {
    undoButton.disabled = historyIndex <= 0;
    redoButton.disabled = historyIndex >= history.length - 1;
  }

  function loadImage(src) {
    if (currentFrameSrc === src && currentFrameImage) {
      return Promise.resolve(currentFrameImage);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        currentFrameImage = img;
        currentFrameSrc = src;
        resolve(img);
      };
      img.onerror = (errorEvent) => {
        currentFrameImage = null;
        currentFrameSrc = null;
        reject(errorEvent);
      };
      img.src = src;
    });
  }

  function updateControlsToDefaults(deviceName) {
    const defaults = deviceFramesDefaults[deviceName];
    if (!defaults) return;

    isApplyingState = true;

    const deviceChanged = deviceFrameSelect.value !== deviceName;
    if (deviceChanged) {
      currentFrameImage = null;
      currentFrameSrc = null;
    }

    canvas.width = defaults.canvasWidth;
    canvas.height = defaults.canvasHeight;

    deviceFrameSelect.value = deviceName;

    screenXInput.value = defaults.screenX;
    screenYInput.value = defaults.screenY;
    screenWidthInput.value = defaults.screenWidth;
    screenHeightInput.value = defaults.screenHeight;
    screenScaleInput.value = defaults.screenScale;
    borderRadiusInput.value = defaults.borderRadius;
    screenXRange.value = defaults.screenX;
    screenYRange.value = defaults.screenY;
    screenWidthRange.value = defaults.screenWidth;
    screenHeightRange.value = defaults.screenHeight;
    screenScaleRange.value = defaults.screenScale;
    borderRadiusRange.value = defaults.borderRadius;

    frameXInput.value = defaults.frameX;
    frameYInput.value = defaults.frameY;
    frameWidthInput.value = defaults.frameWidth;
    frameHeightInput.value = defaults.frameHeight;
    frameScaleInput.value = defaults.frameScale;
    frameXRange.value = defaults.frameX;
    frameYRange.value = defaults.frameY;
    frameWidthRange.value = defaults.frameWidth;
    frameHeightRange.value = defaults.frameHeight;
    frameScaleRange.value = defaults.frameScale;

    fontFamilySelect.value = textDefaults.fontFamily;
    fontSizeInput.value = textDefaults.fontSize;
    textYOffsetInput.value = textDefaults.textYOffset;
    fontSizeRange.value = textDefaults.fontSize;
    textYOffsetRange.value = textDefaults.textYOffset;

    subtitleTextInput.value = "";
    titleTextInput.value = "";
    backgroundColorInput.value = "#ffffff";
    textColorInput.value = "#000000";

    isApplyingState = false;

    drawCanvas().then(() => {
      saveHistory();
    });
  }

  async function drawCanvas() {
    if (!screenshotImage) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      downloadButton.style.display = "none";
      return;
    }

    const selectedDeviceValue = deviceFrameSelect.value;
    const frameDefaultInfo = deviceFramesDefaults[selectedDeviceValue];
    if (!frameDefaultInfo) {
      console.error(
        "선택된 기기 기본 정보를 찾을 수 없습니다:",
        selectedDeviceValue
      );
      return;
    }

    if (
      canvas.width !== frameDefaultInfo.canvasWidth ||
      canvas.height !== frameDefaultInfo.canvasHeight
    ) {
      canvas.width = frameDefaultInfo.canvasWidth;
      canvas.height = frameDefaultInfo.canvasHeight;
    }

    const screenX = parseInt(screenXInput.value) || 0;
    const screenY = parseInt(screenYInput.value) || 0;
    const screenBaseWidth = parseInt(screenWidthInput.value) || 100;
    const screenBaseHeight = parseInt(screenHeightInput.value) || 100;
    const screenScale = parseFloat(screenScaleInput.value) || 1;
    const borderRadius = parseInt(borderRadiusInput.value) || 0;

    const frameX = parseInt(frameXInput.value) || 0;
    const frameY = parseInt(frameYInput.value) || 0;
    const frameBaseWidth = parseInt(frameWidthInput.value) || 100;
    const frameBaseHeight = parseInt(frameHeightInput.value) || 100;
    const frameScale = parseFloat(frameScaleInput.value) || 1;

    const bgColor = backgroundColorInput.value;
    const titleText = titleTextInput.value;
    const subtitleText = subtitleTextInput.value;
    const textColor = textColorInput.value;
    const fontFamily = fontFamilySelect.value;
    const fontSize = parseInt(fontSizeInput.value) || 30;
    const textYOffset = parseInt(textYOffsetInput.value) || 50;

    const scaledScreenWidth = screenBaseWidth * screenScale;
    const scaledScreenHeight = screenBaseHeight * screenScale;
    const screenDrawX = screenX + (screenBaseWidth - scaledScreenWidth) / 2;
    const screenDrawY = screenY + (screenBaseHeight - scaledScreenHeight) / 2;

    const scaledFrameWidth = frameBaseWidth * frameScale;
    const scaledFrameHeight = frameBaseHeight * frameScale;
    const frameDrawX = frameX + (frameBaseWidth - scaledFrameWidth) / 2;
    const frameDrawY = frameY + (frameBaseHeight - scaledFrameHeight) / 2;

    try {
      const frameImg = await loadImage(frameDefaultInfo.src);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.beginPath();
      const effectiveBorderRadius = Math.min(
        borderRadius,
        scaledScreenWidth / 2,
        scaledScreenHeight / 2
      );
      if (ctx.roundRect) {
        ctx.roundRect(
          screenDrawX,
          screenDrawY,
          scaledScreenWidth,
          scaledScreenHeight,
          effectiveBorderRadius
        );
        ctx.clip();
      } else {
        ctx.rect(
          screenDrawX,
          screenDrawY,
          scaledScreenWidth,
          scaledScreenHeight
        );
        ctx.clip();
      }
      ctx.drawImage(
        screenshotImage,
        screenDrawX,
        screenDrawY,
        scaledScreenWidth,
        scaledScreenHeight
      );
      ctx.restore();

      ctx.drawImage(
        frameImg,
        frameDrawX,
        frameDrawY,
        scaledFrameWidth,
        scaledFrameHeight
      );

      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      const textX = canvas.width / 2;

      if (titleText) {
        ctx.font = `${fontSize}px ${fontFamily}`;
        const titleY = textYOffset;
        ctx.fillText(titleText, textX, titleY);

        if (subtitleText) {
          const subtitleFontSize = Math.round(
            fontSize * textDefaults.subtitleFontSizeRatio
          );
          const subtitleY =
            titleY +
            Math.round(fontSize * textDefaults.subtitleLineHeightRatio);
          ctx.font = `${subtitleFontSize}px ${fontFamily}`;
          ctx.fillText(subtitleText, textX, subtitleY);
        }
      }

      downloadButton.style.display = "block";
    } catch (error) {
      console.error(
        `이미지 로드 또는 그리기에 실패했습니다. 시도한 프레임 소스: ${frameDefaultInfo?.src}`,
        error
      );
      downloadButton.style.display = "none";
    }
  }

  function setupSliderSync(
    numberInput,
    rangeInput,
    isFloat = false,
    decimalPlaces = 0
  ) {
    rangeInput.addEventListener("input", () => {
      const value = rangeInput.value;
      numberInput.value = isFloat
        ? parseFloat(value).toFixed(decimalPlaces)
        : value;
      drawCanvas();
    });

    rangeInput.addEventListener("change", () => {
      const value = rangeInput.value;
      numberInput.value = isFloat
        ? parseFloat(value).toFixed(decimalPlaces)
        : value;
      saveHistory();
    });

    numberInput.addEventListener("change", () => {
      const parseFunc = isFloat ? parseFloat : parseInt;
      let value = parseFunc(numberInput.value) || 0;
      const min = parseFunc(rangeInput.min) || 0;
      const max = parseFunc(rangeInput.max) || 100;
      const step = isFloat ? parseFloat(rangeInput.step) || 0.01 : 1;

      let clampedValue = Math.max(min, Math.min(value, max));

      if (isFloat && step > 0) {
        clampedValue = Math.round(clampedValue / step) * step;
        clampedValue = Math.max(min, Math.min(clampedValue, max));
      }

      const formattedClampedValue = isFloat
        ? clampedValue.toFixed(decimalPlaces)
        : clampedValue.toString();
      numberInput.value = formattedClampedValue;

      rangeInput.value = clampedValue;
      drawCanvas();
      saveHistory();
    });
  }

  setupSliderSync(screenXInput, screenXRange);
  setupSliderSync(screenYInput, screenYRange);
  setupSliderSync(screenWidthInput, screenWidthRange);
  setupSliderSync(screenHeightInput, screenHeightRange);
  setupSliderSync(screenScaleInput, screenScaleRange, true, 2);
  setupSliderSync(borderRadiusInput, borderRadiusRange);
  setupSliderSync(frameXInput, frameXRange);
  setupSliderSync(frameYInput, frameYRange);
  setupSliderSync(frameWidthInput, frameWidthRange);
  setupSliderSync(frameHeightInput, frameHeightRange);
  setupSliderSync(frameScaleInput, frameScaleRange, true, 2);
  setupSliderSync(fontSizeInput, fontSizeRange);
  setupSliderSync(textYOffsetInput, textYOffsetRange);

  screenshotFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        screenshotImage = new Image();
        screenshotImage.onload = () => {
          drawCanvas();
        };
        screenshotImage.onerror = () => {
          alert("스크린샷 이미지 로드에 실패했습니다.");
          screenshotImage = null;
          drawCanvas();
        };
        screenshotImage.src = e.target.result;
      };
      reader.onerror = () => {
        alert("파일을 읽는 중 오류가 발생했습니다.");
        screenshotImage = null;
        drawCanvas();
      };
      reader.readAsDataURL(file);
    } else {
      screenshotImage = null;
      drawCanvas();
    }
  });

  deviceFrameSelect.addEventListener("change", () => {
    updateControlsToDefaults(deviceFrameSelect.value);
  });

  resetButton.addEventListener("click", () => {
    updateControlsToDefaults(deviceFrameSelect.value);
  });

  const otherControlInputs = [
    backgroundColorInput,
    titleTextInput,
    subtitleTextInput,
    textColorInput,
    fontFamilySelect,
  ];
  otherControlInputs.forEach((input) => {
    const eventType =
      input.tagName === "INPUT" && input.type === "text"
        ? "change"
        : input.tagName === "SELECT" || input.type === "color"
        ? "change"
        : "input";
    input.addEventListener(eventType, () => {
      drawCanvas();
      saveHistory();
    });
  });

  const collapsibleHeaders = document.querySelectorAll(".collapsible-header");
  collapsibleHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      const controlGroup = header.closest(".control-group");
      const content = controlGroup.querySelector(".collapsible-content");
      const icon = header.querySelector(".toggle-icon");

      if (controlGroup && content && icon) {
        const isCollapsed = controlGroup.classList.contains("collapsed");
        if (isCollapsed) {
          controlGroup.classList.remove("collapsed");
          content.style.maxHeight = content.scrollHeight + "px";
          icon.textContent = "-";
        } else {
          content.style.maxHeight = "0px";
          controlGroup.classList.add("collapsed");
          icon.textContent = "+";
        }
      }
    });
    const controlGroup = header.closest(".control-group");
    const content = controlGroup.querySelector(".collapsible-content");
    const icon = header.querySelector(".toggle-icon");
    if (controlGroup && content && icon) {
      if (controlGroup.classList.contains("collapsed")) {
        content.style.maxHeight = "0px";
        icon.textContent = "+";
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
        icon.textContent = "-";
      }
      setTimeout(() => {
        content.style.transition = "max-height 0.3s ease-out";
      }, 0);
    }
  });

  downloadButton.addEventListener("click", () => {
    if (!screenshotImage || canvas.width === 0 || canvas.height === 0) {
      alert("다운로드할 이미지가 없습니다. 스크린샷을 먼저 업로드해주세요.");
      return;
    }
    try {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      let safeTitle = titleTextInput.value
        .replace(/[\\/:\*\?"<>\|]/g, "_")
        .replace(/\s+/g, "_");
      const titlePart = safeTitle || "preview";
      link.href = image;
      link.download = `app_${titlePart}_${deviceFrameSelect.value}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("이미지 다운로드 중 오류 발생:", e);
      if (e.name === "SecurityError") {
        alert("캔버스 보안 오류: 외부 이미지 사용 시 발생할 수 있습니다.");
      } else {
        alert("이미지 다운로드 중 오류가 발생했습니다.");
      }
    }
  });

  undoButton.addEventListener("click", undo);
  redoButton.addEventListener("click", redo);

  document.addEventListener("keydown", (e) => {
    if (
      document.activeElement.tagName === "INPUT" &&
      document.activeElement.type === "text"
    ) {
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.key === "z") {
        e.preventDefault();
        undo();
      } else if (e.key === "y") {
        e.preventDefault();
        redo();
      }
    }
  });

  updateControlsToDefaults(deviceFrameSelect.value);
  updateUndoRedoButtons();
});
