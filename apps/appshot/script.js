document.addEventListener("DOMContentLoaded", () => {
  const screenshotFileInput = document.getElementById("screenshotFile");
  const deviceFrameSelect = document.getElementById("deviceFrame");
  const resetButton = document.getElementById("resetButton");
  const undoButton = document.getElementById("undoButton");
  const redoButton = document.getElementById("redoButton");

  const portraitButton = document.getElementById("portraitButton");
  const landscapeButton = document.getElementById("landscapeButton");

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
  const backgroundTypeSelect = document.getElementById("backgroundTypeSelect");
  const gradientControlsContainer = document.getElementById(
    "gradientControlsContainer"
  );
  const solidColorContainer = document.getElementById("solidColorContainer");
  const gradientColor1Input = document.getElementById("gradientColor1");
  const gradientColor2Input = document.getElementById("gradientColor2");
  const gradientDirectionContainer = document.getElementById(
    "gradientDirectionContainer"
  );
  const gradientDirectionSelect = document.getElementById(
    "gradientDirectionSelect"
  );

  const titleTextInput = document.getElementById("titleText");
  const subtitleTextInput = document.getElementById("subtitleText");
  const textColorInput = document.getElementById("textColor");
  const fontFamilySelect = document.getElementById("fontFamily");
  const fontSizeInput = document.getElementById("fontSize");
  const textYOffsetInput = document.getElementById("textYOffset");
  const fontSizeRange = document.getElementById("fontSizeRange");
  const textYOffsetRange = document.getElementById("textYOffsetRange");
  const textXOffsetInput = document.getElementById("textXOffset");
  const textXOffsetRange = document.getElementById("textXOffsetRange");

  const canvas = document.getElementById("previewCanvas");
  const downloadButton = document.getElementById("downloadButton");
  const ctx = canvas.getContext("2d");

  let screenshotImage = null;
  let currentFrameImage = null;
  let currentFrameSrc = null;
  let currentOrientation = "portrait";

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
    fontFamily: "'Pretendard', sans-serif",
    fontSize: 50,
    textYOffset: 80,
    subtitleFontSizeRatio: 0.6,
    subtitleLineHeightRatio: 1.2,
  };

  let history = [];
  let historyIndex = -1;
  const MAX_HISTORY = 50;
  let isApplyingState = false;

  function updateSliderRanges() {
    const currentCanvasWidth = canvas.width;
    const currentCanvasHeight = canvas.height;
    const positionBuffer = 200;
    const sizeBuffer = 400;

    screenXRange.min = -positionBuffer;
    screenXRange.max = currentCanvasWidth + positionBuffer;
    screenYRange.min = -positionBuffer;
    screenYRange.max = currentCanvasHeight + positionBuffer;
    screenWidthRange.max = Math.max(
      parseInt(screenWidthRange.max) || 0,
      currentCanvasWidth + sizeBuffer
    );
    screenHeightRange.max = Math.max(
      parseInt(screenHeightRange.max) || 0,
      currentCanvasHeight + sizeBuffer
    );

    frameXRange.min = -positionBuffer;
    frameXRange.max = currentCanvasWidth + positionBuffer;
    frameYRange.min = -positionBuffer;
    frameYRange.max = currentCanvasHeight + positionBuffer;
    frameWidthRange.max = Math.max(
      parseInt(frameWidthRange.max) || 0,
      currentCanvasWidth + sizeBuffer
    );
    frameHeightRange.max = Math.max(
      parseInt(frameHeightRange.max) || 0,
      currentCanvasHeight + sizeBuffer
    );

    const textXRangeLimit = Math.round(currentCanvasWidth / 2) + positionBuffer;
    textXOffsetRange.min = -textXRangeLimit;
    textXOffsetRange.max = textXRangeLimit;

    textYOffsetRange.min = -positionBuffer;
    textYOffsetRange.max = currentCanvasHeight + positionBuffer;

    const clampValue = (input, range) => {
      if (!input || !range) return;
      const val = parseFloat(input.value);
      const min = parseFloat(range.min);
      const max = parseFloat(range.max);
      if (isNaN(min) || isNaN(max)) return;

      let clamped = val;
      if (val < min) clamped = min;
      if (val > max) clamped = max;

      if (clamped !== val) {
        input.value = clamped;
      }
      range.value = Math.max(min, Math.min(parseFloat(range.value), max));
    };

    clampValue(screenXInput, screenXRange);
    clampValue(screenYInput, screenYRange);
    clampValue(frameXInput, frameXRange);
    clampValue(frameYInput, frameYRange);
    clampValue(textXOffsetInput, textXOffsetRange);
    clampValue(textYOffsetInput, textYOffsetRange);
  }

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
      backgroundType: backgroundTypeSelect.value,
      gradientColor1: gradientColor1Input.value,
      gradientColor2: gradientColor2Input.value,
      gradientDirection: gradientDirectionSelect.value,
      titleText: titleTextInput.value,
      subtitleText: subtitleTextInput.value,
      textColor: textColorInput.value,
      fontFamily: fontFamilySelect.value,
      fontSize: fontSizeInput.value,
      textXOffset: textXOffsetInput.value,
      textYOffset: textYOffsetInput.value,
      orientation: currentOrientation,
    };
  }

  function applyState(state, redraw = true) {
    if (!state) return;
    isApplyingState = true;

    const deviceChanged = deviceFrameSelect.value !== state.deviceFrame;
    const orientationChanged = currentOrientation !== state.orientation;

    if (orientationChanged) {
      setOrientation(state.orientation, false);
    } else if (deviceChanged) {
      updateCanvasDimensions();
    }

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
    titleTextInput.value = state.titleText;
    subtitleTextInput.value = state.subtitleText;
    textColorInput.value = state.textColor;
    fontFamilySelect.value = state.fontFamily;
    fontSizeInput.value = state.fontSize;
    textXOffsetInput.value = state.textXOffset || 0;
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
    textXOffsetRange.value = state.textXOffset || 0;
    textYOffsetRange.value = state.textYOffset;

    backgroundTypeSelect.value = state.backgroundType || "solid";
    backgroundColorInput.value = state.backgroundColor || "#ffffff";
    gradientColor1Input.value = state.gradientColor1 || "#ffffff";
    gradientColor2Input.value = state.gradientColor2 || "#e0e0e0";
    gradientDirectionSelect.value = state.gradientDirection || "to_bottom";

    updateBackgroundControlVisibility(backgroundTypeSelect.value);

    updateSliderRanges();

    if (redraw) {
      if (deviceChanged && !orientationChanged) {
        currentFrameImage = null;
        currentFrameSrc = null;
      }
      drawCanvas();
    }

    isApplyingState = false;
  }

  function updateCanvasDimensions() {
    const selectedDeviceValue = deviceFrameSelect.value;
    const defaults = deviceFramesDefaults[selectedDeviceValue];
    if (!defaults) return;

    let targetWidth = defaults.canvasWidth;
    let targetHeight = defaults.canvasHeight;

    if (currentOrientation === "landscape") {
      targetWidth = defaults.canvasHeight;
      targetHeight = defaults.canvasWidth;
    }

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
    updateSliderRanges();
  }

  function setOrientation(newOrientation, shouldSaveHistory = true) {
    if (currentOrientation === newOrientation) return;

    currentOrientation = newOrientation;

    portraitButton.classList.toggle(
      "active",
      currentOrientation === "portrait"
    );
    landscapeButton.classList.toggle(
      "active",
      currentOrientation === "landscape"
    );

    updateCanvasDimensions();

    if (shouldSaveHistory) {
      drawCanvas().then(() => {
        saveHistory();
      });
    } else {
      drawCanvas();
    }
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
        console.error("Failed to load frame image:", src, errorEvent);
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

    setOrientation("portrait", false);
    updateCanvasDimensions();

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
    textXOffsetInput.value = 0;
    textYOffsetInput.value = textDefaults.textYOffset;
    fontSizeRange.value = textDefaults.fontSize;
    textXOffsetRange.value = 0;
    textYOffsetRange.value = textDefaults.textYOffset;
    subtitleTextInput.value = "";
    titleTextInput.value = "";
    textColorInput.value = "#000000";

    backgroundTypeSelect.value = "solid";
    backgroundColorInput.value = "#ffffff";
    gradientColor1Input.value = "#ffffff";
    gradientColor2Input.value = "#e0e0e0";
    gradientDirectionSelect.value = "to_bottom";
    updateBackgroundControlVisibility("solid");

    updateSliderRanges();

    isApplyingState = false;

    drawCanvas().then(() => {
      saveHistory();
    });
  }

  function updateBackgroundControlVisibility(backgroundType) {
    const isLinear = backgroundType === "linear";
    const isGradient = isLinear || backgroundType === "radial";

    solidColorContainer.style.display = !isGradient ? "" : "none";
    gradientControlsContainer.style.display = isGradient ? "" : "none";
    gradientDirectionContainer.style.display = isLinear ? "" : "none";

    const parentCollapsibleContent = backgroundTypeSelect.closest(
      ".collapsible-content"
    );
    if (parentCollapsibleContent) {
      const parentControlGroup = parentCollapsibleContent.closest(
        ".control-group.collapsible"
      );
      if (
        parentControlGroup &&
        !parentControlGroup.classList.contains("collapsed")
      ) {
        setTimeout(() => {
          parentCollapsibleContent.style.maxHeight =
            parentCollapsibleContent.scrollHeight + "px";
        }, 0);
      }
    }
  }

  async function drawCanvas() {
    const selectedDeviceValue = deviceFrameSelect.value;
    const frameDefaultInfo = deviceFramesDefaults[selectedDeviceValue];
    if (!frameDefaultInfo) {
      console.error("Device defaults not found for:", selectedDeviceValue);
      return;
    }

    const targetCanvasWidth = canvas.width;
    const targetCanvasHeight = canvas.height;

    if (!screenshotImage) {
      ctx.clearRect(0, 0, targetCanvasWidth, targetCanvasHeight);
      ctx.fillStyle = "#cccccc";
      ctx.fillRect(0, 0, targetCanvasWidth, targetCanvasHeight);
      ctx.fillStyle = "#555555";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "20px sans-serif";
      ctx.fillText(
        "스크린샷을 업로드하세요",
        targetCanvasWidth / 2,
        targetCanvasHeight / 2
      );
      downloadButton.style.display = "none";
      return;
    }

    const screenX_raw = parseInt(screenXInput.value) || 0;
    const screenY_raw = parseInt(screenYInput.value) || 0;
    const screenW_raw = parseInt(screenWidthInput.value) || 100;
    const screenH_raw = parseInt(screenHeightInput.value) || 100;
    const screenScale_raw = parseFloat(screenScaleInput.value) || 1;
    const borderRadius_raw = parseInt(borderRadiusInput.value) || 0;
    const frameX_raw = parseInt(frameXInput.value) || 0;
    const frameY_raw = parseInt(frameYInput.value) || 0;
    const frameW_raw = parseInt(frameWidthInput.value) || 100;
    const frameH_raw = parseInt(frameHeightInput.value) || 100;
    const frameScale_raw = parseFloat(frameScaleInput.value) || 1;
    const titleText = titleTextInput.value;
    const subtitleText = subtitleTextInput.value;
    const textColor = textColorInput.value;
    const fontFamily = fontFamilySelect.value;
    const fontSize = parseInt(fontSizeInput.value) || 30;
    const textXOffset = parseInt(textXOffsetInput.value) || 0;
    const textYOffset = parseInt(textYOffsetInput.value) || 50;

    const frameScaledW = frameW_raw * frameScale_raw;
    const frameScaledH = frameH_raw * frameScale_raw;
    const frameX = frameX_raw + (frameW_raw - frameScaledW) / 2;
    const frameY = frameY_raw + (frameH_raw - frameScaledH) / 2;

    const screenScaledW = screenW_raw * screenScale_raw;
    const screenScaledH = screenH_raw * screenScale_raw;
    const screenX = screenX_raw + (screenW_raw - screenScaledW) / 2;
    const screenY = screenY_raw + (screenH_raw - screenScaledH) / 2;

    const effectiveRadius = Math.min(
      borderRadius_raw,
      screenScaledW / 2,
      screenScaledH / 2
    );

    try {
      const frameImg = await loadImage(frameDefaultInfo.src);
      ctx.clearRect(0, 0, targetCanvasWidth, targetCanvasHeight);

      const backgroundType = backgroundTypeSelect.value;
      if (backgroundType === "solid") {
        ctx.fillStyle = backgroundColorInput.value;
        ctx.fillRect(0, 0, targetCanvasWidth, targetCanvasHeight);
      } else {
        const color1 = gradientColor1Input.value;
        const color2 = gradientColor2Input.value;
        let gradient;

        if (backgroundType === "linear") {
          const direction = gradientDirectionSelect.value;
          let x0 = 0,
            y0 = 0,
            x1 = 0,
            y1 = 0;
          switch (direction) {
            case "to_right":
              x1 = targetCanvasWidth;
              break;
            case "to_bottom_right":
              x1 = targetCanvasWidth;
              y1 = targetCanvasHeight;
              break;
            case "to_bottom_left":
              y1 = targetCanvasHeight;
              x0 = targetCanvasWidth;
              break;
            case "to_top":
              y0 = targetCanvasHeight;
              break;
            case "to_left":
              x0 = targetCanvasWidth;
              break;
            case "to_top_right":
              x1 = targetCanvasWidth;
              y0 = targetCanvasHeight;
              break;
            case "to_top_left":
              x0 = targetCanvasWidth;
              y0 = targetCanvasHeight;
              break;
            case "to_bottom":
            default:
              y1 = targetCanvasHeight;
              break;
          }
          gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        } else {
          const centerX = targetCanvasWidth / 2;
          const centerY = targetCanvasHeight / 2;
          const radius = Math.max(targetCanvasWidth, targetCanvasHeight) / 1.5;
          gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            0,
            centerX,
            centerY,
            radius
          );
        }
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, targetCanvasWidth, targetCanvasHeight);
      }

      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(
          screenX,
          screenY,
          screenScaledW,
          screenScaledH,
          effectiveRadius
        );
        ctx.clip();
      } else {
        console.warn("ctx.roundRect not supported, using rectangular clip.");
        ctx.rect(screenX, screenY, screenScaledW, screenScaledH);
        ctx.clip();
      }
      ctx.drawImage(
        screenshotImage,
        screenX,
        screenY,
        screenScaledW,
        screenScaledH
      );
      ctx.restore();

      ctx.drawImage(frameImg, frameX, frameY, frameScaledW, frameScaledH);

      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const textX = targetCanvasWidth / 2 + textXOffset;

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
            Math.round(fontSize * textDefaults.subtitleLineHeightRatio * 0.6) +
            Math.round(subtitleFontSize * 0.6);
          ctx.font = `${subtitleFontSize}px ${fontFamily}`;
          ctx.fillText(subtitleText, textX, subtitleY);
        }
      }

      downloadButton.style.display = "block";
    } catch (error) {
      console.error(
        `Failed to load or draw image. Frame src: ${frameDefaultInfo?.src}`,
        error
      );
      ctx.fillStyle = "#ffdddd";
      ctx.fillRect(0, 0, targetCanvasWidth, targetCanvasHeight);
      ctx.fillStyle = "#cc0000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "16px sans-serif";
      ctx.fillText(
        "이미지 로딩 또는 그리기에 실패했습니다.",
        targetCanvasWidth / 2,
        targetCanvasHeight / 2
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
    if (!numberInput || !rangeInput) {
      console.warn("setupSliderSync: Input or range element not found.");
      return;
    }
    rangeInput.addEventListener("input", () => {
      const value = rangeInput.value;
      numberInput.value = isFloat
        ? parseFloat(value).toFixed(decimalPlaces)
        : value;
      drawCanvas();
    });

    rangeInput.addEventListener("change", () => {
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

      if (numberInput.value !== formattedClampedValue) {
        numberInput.value = formattedClampedValue;
      }
      if (rangeInput.value !== clampedValue.toString()) {
        rangeInput.value = clampedValue;
      }

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
  setupSliderSync(textXOffsetInput, textXOffsetRange);
  setupSliderSync(textYOffsetInput, textYOffsetRange);

  screenshotFileInput.addEventListener("change", (event) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      console.log("File selection cancelled.");
      event.target.value = null;
      return;
    }

    const file = files[0];
    console.log("File selected:", file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      screenshotImage = new Image();
      screenshotImage.onload = () => {
        console.log("Screenshot image loaded successfully.");
        drawCanvas().then(() => saveHistory());
      };
      screenshotImage.onerror = () => {
        console.error("Failed to load screenshot image data.");
        alert("스크린샷 이미지 로딩에 실패했습니다.");
        screenshotImage = null;
        drawCanvas();
      };
      screenshotImage.src = e.target.result;
    };

    reader.onerror = (e) => {
      console.error("Error reading file:", e);
      alert("파일을 읽는 중 오류가 발생했습니다.");
      screenshotImage = null;
      drawCanvas();
    };

    reader.readAsDataURL(file);
    event.target.value = null;
  });

  deviceFrameSelect.addEventListener("change", () => {
    updateControlsToDefaults(deviceFrameSelect.value);
  });

  resetButton.addEventListener("click", () => {
    updateControlsToDefaults(deviceFrameSelect.value);
  });

  portraitButton.addEventListener("click", () => setOrientation("portrait"));
  landscapeButton.addEventListener("click", () => setOrientation("landscape"));

  backgroundTypeSelect.addEventListener("change", () => {
    updateBackgroundControlVisibility(backgroundTypeSelect.value);
    drawCanvas();
    saveHistory();
  });

  backgroundColorInput.addEventListener("change", () => {
    drawCanvas();
    saveHistory();
  });

  [gradientColor1Input, gradientColor2Input, gradientDirectionSelect].forEach(
    (input) => {
      input.addEventListener("change", () => {
        drawCanvas();
        saveHistory();
      });
    }
  );

  const otherControlInputs = [
    titleTextInput,
    subtitleTextInput,
    textColorInput,
    fontFamilySelect,
  ];
  otherControlInputs.forEach((input) => {
    const eventType =
      input.tagName === "INPUT" && input.type === "text"
        ? "input"
        : input.tagName === "SELECT" || input.type === "color"
        ? "change"
        : "input";

    input.addEventListener(eventType, () => {
      drawCanvas();
    });

    if (eventType === "change" || input.type === "text") {
      input.addEventListener("change", () => {
        saveHistory();
      });
    }
  });

  const collapsibleHeaders = document.querySelectorAll(".collapsible-header");
  collapsibleHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      const controlGroup = header.closest(".control-group.collapsible");
      const content = controlGroup?.querySelector(".collapsible-content");
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

    const controlGroup = header.closest(".control-group.collapsible");
    const content = controlGroup?.querySelector(".collapsible-content");
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
      }, 10);
    }
  });

  downloadButton.addEventListener("click", () => {
    if (!screenshotImage || canvas.width === 0 || canvas.height === 0) {
      alert("다운로드할 이미지가 없습니다. 먼저 스크린샷을 업로드하세요.");
      return;
    }
    try {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");

      let safeTitle = titleTextInput.value
        .replace(/[\\/:\*\?"<>\|]/g, "_")
        .replace(/\s+/g, "_");
      const titlePart = safeTitle || "preview";
      const orientationSuffix =
        currentOrientation === "landscape" ? "_landscape" : "";
      const deviceName = deviceFrameSelect.value;

      link.href = image;
      link.download = `appshot_${titlePart}_${deviceName}${orientationSuffix}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Error during image download:", e);
      if (e.name === "SecurityError") {
        alert(
          "캔버스 보안 오류: 외부 이미지를 사용할 때 발생할 수 있습니다. (CORS 설정 확인)"
        );
      } else {
        alert("이미지를 다운로드하는 중 오류가 발생했습니다.");
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

    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
      e.preventDefault();
      redo();
    }
  });

  updateCanvasDimensions();
  updateControlsToDefaults(deviceFrameSelect.value);
  updateUndoRedoButtons();
  updateBackgroundControlVisibility(backgroundTypeSelect.value);
  drawCanvas();
});
