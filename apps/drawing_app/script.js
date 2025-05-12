document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("drawingCanvas");
  const ctx = canvas.getContext("2d");
  const colorPicker = document.getElementById("colorPicker");
  const brushSizeInput = document.getElementById("brushSize");
  const brushSizeValue = document.getElementById("brushSizeValue");
  const clearButton = document.getElementById("clearButton");

  const pencilButton = document.getElementById("pencilButton");
  const eraserButton = document.getElementById("eraserButton");
  const fillButton = document.getElementById("fillButton");
  const rectButton = document.getElementById("rectButton");
  const circleButton = document.getElementById("circleButton");

  const toolButtons = [
    pencilButton,
    eraserButton,
    fillButton,
    rectButton,
    circleButton,
  ].filter(Boolean);

  let isDrawing = false;
  let currentTool = "pencil";
  let currentBrushSize = brushSizeInput.value;
  let currentBrushColor = colorPicker.value;
  let lastX = 0;
  let lastY = 0;
  let startX = 0;
  let startY = 0;
  let canvasSnapshot = null;

  function resizeCanvas() {
    const style = getComputedStyle(canvas);
    const width = parseInt(style.width) || 800;
    const height = parseInt(style.height) || 600;

    if (isDrawing) {
      isDrawing = false;
      canvasSnapshot = null; 
      console.log("Drawing cancelled due to resize.");
    }

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas(); 

  function resetDrawingState() {
    isDrawing = false;
    canvasSnapshot = null;
  }

  function hexToRgb(hex) {
    if (!hex) return null;
    let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });

    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
  }

  function getTouchPos(evt) {
    const rect = canvas.getBoundingClientRect();
    let touch = null;

    if (evt.touches && evt.touches.length > 0) {
      touch = evt.touches[0];
    } else if (evt.changedTouches && evt.changedTouches.length > 0) {
      touch = evt.changedTouches[0];
    }

    if (touch) {
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return null;
  }


  function updateActiveToolButton(activeButton) {
    toolButtons.forEach((button) => {
      if (button) button.classList.remove("active-tool");
    });
    if (activeButton) {
      activeButton.classList.add("active-tool");
    }
  }

  function drawLine(x1, y1, x2, y2, color, size, compositeOp = "source-over") {
    ctx.globalCompositeOperation = compositeOp;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
    ctx.globalCompositeOperation = "source-over";
  }

  function drawRectangle(x1, y1, x2, y2, color, size) {
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.rect(x1, y1, x2 - x1, y2 - y1);
    ctx.stroke();
    ctx.closePath();
  }

  function drawCircle(cx, cy, endX, endY, color, size) {
    const radius = Math.sqrt(Math.pow(endX - cx, 2) + Math.pow(endY - cy, 2));
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();
  }

  colorPicker.addEventListener("input", (e) => {
    currentBrushColor = e.target.value;
  });

  brushSizeInput.addEventListener("input", (e) => {
    currentBrushSize = e.target.value;
    if (brushSizeValue) {
      brushSizeValue.textContent = e.target.value;
    }
  });

  function setActiveTool(toolName, buttonElement) {
    if (isDrawing) {
      if (canvasSnapshot && (currentTool === "rectangle" || currentTool === "circle")) {
        ctx.putImageData(canvasSnapshot, 0, 0);
      }
      resetDrawingState();
      console.log(`Drawing operation cancelled due to tool switch to ${toolName}.`);
    }
    currentTool = toolName;
    updateActiveToolButton(buttonElement);
  }

  clearButton.addEventListener("click", () => {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    resetDrawingState(); 
    console.log("Canvas cleared and drawing state reset.");
  });

  const toolButtonMappings = [
    { button: pencilButton, name: "pencil" },
    { button: eraserButton, name: "eraser" },
    { button: fillButton, name: "fill" },
    { button: rectButton, name: "rectangle" },
    { button: circleButton, name: "circle" },
  ];

  toolButtonMappings.forEach(mapping => {
    if (mapping.button) {
      mapping.button.addEventListener('click', () => setActiveTool(mapping.name, mapping.button));
    }
  });

  if (pencilButton) updateActiveToolButton(pencilButton);

  function handleDrawStart(pos) {
    if (!pos) return; 

    isDrawing = true;
    lastX = pos.x;
    lastY = pos.y;
    startX = pos.x;
    startY = pos.y;

    if (currentTool === "pencil" || currentTool === "eraser") {
    } else if (currentTool === "rectangle" || currentTool === "circle") {
      canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else if (currentTool === "fill") {
      floodFill(startX, startY, currentBrushColor);
      isDrawing = false; 
    }
  }

  function handleDrawMove(pos) {
    if (!isDrawing) return;
    if (!pos) return;

    if (currentTool === "pencil") {
      drawLine(lastX, lastY, pos.x, pos.y, currentBrushColor, currentBrushSize);
    } else if (currentTool === "eraser") {
      drawLine(
        lastX,
        lastY,
        pos.x,
        pos.y,
        "rgba(0,0,0,1)",
        currentBrushSize,
        "destination-out"
      );
    } else if (currentTool === "rectangle" && canvasSnapshot) {
      ctx.putImageData(canvasSnapshot, 0, 0);
      drawRectangle(
        startX,
        startY,
        pos.x,
        pos.y,
        currentBrushColor,
        currentBrushSize
      );
    } else if (currentTool === "circle" && canvasSnapshot) {
      ctx.putImageData(canvasSnapshot, 0, 0);
      drawCircle(
        startX,
        startY,
        pos.x,
        pos.y,
        currentBrushColor,
        currentBrushSize
      );
    }
    lastX = pos.x;
    lastY = pos.y;
  }

  function handleDrawEnd(pos) {
    if (!isDrawing) return;
    if (!pos && (currentTool === "rectangle" || currentTool === "circle")) { 
        console.warn("handleDrawEnd called without position for shape tool, resetting state.");
        resetDrawingState();
        return;
    }

    if (currentTool === "rectangle") {
      if (canvasSnapshot) ctx.putImageData(canvasSnapshot, 0, 0);
      drawRectangle(
        startX,
        startY,
        pos.x,
        pos.y,
        currentBrushColor,
        currentBrushSize
      );
    } else if (currentTool === "circle") {
      if (canvasSnapshot) ctx.putImageData(canvasSnapshot, 0, 0);
      drawCircle(
        startX,
        startY,
        pos.x,
        pos.y,
        currentBrushColor,
        currentBrushSize
      );
    }
    resetDrawingState();
  }

  canvas.addEventListener("mousedown", (e) => {
    const pos = getMousePos(e);
    handleDrawStart(pos);
  });

  canvas.addEventListener("mousemove", (e) => {
    const pos = getMousePos(e);
    handleDrawMove(pos);
  });

  canvas.addEventListener("mouseup", (e) => {
    const pos = getMousePos(e);
    handleDrawEnd(pos);
  });

  canvas.addEventListener("mouseout", (e) => {
    if (isDrawing) {
      const pos = getMousePos(e); 
      handleDrawEnd(pos); 
    }
  });

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault(); 
    const pos = getTouchPos(e);
    handleDrawStart(pos);
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const pos = getTouchPos(e);
    handleDrawMove(pos);
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    const pos = getTouchPos(e); 
    handleDrawEnd(pos);
  }, { passive: false });

  canvas.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    console.log("Touch cancelled, resetting drawing state.");
    resetDrawingState(); 
  }, { passive: false });

  function getPixelColorFromData(data, x, y, canvasWidth) {
    const offset = (y * canvasWidth + x) * 4;
    if (offset < 0 || offset + 3 >= data.length) return null;
    return {
      r: data[offset],
      g: data[offset + 1],
      b: data[offset + 2],
      a: data[offset + 3],
    };
  }

  function setPixelColorInData(data, x, y, canvasWidth, color) {
    const offset = (y * canvasWidth + x) * 4;
    data[offset] = color.r;
    data[offset + 1] = color.g;
    data[offset + 2] = color.b;
    data[offset + 3] = 255;
  }

  function colorsMatch(c1, c2) {
    if (!c1 || !c2) return false;
    return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b;
  }

  function floodFill(startX, startY, fillColorHex) {
    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
    const data = imageData.data;

    const targetColor = getPixelColorFromData(data, startX, startY, canvasW);
    const fillColor = hexToRgb(fillColorHex);

    if (!targetColor || !fillColor) {
      console.error("Flood fill: Invalid color data.");
      return;
    }
    if (colorsMatch(targetColor, fillColor)) {
      console.log("Flood fill: Target color is the same as fill color. No fill needed.");
      return;
    }

    const queue = [[startX, startY]];
    const visited = new Set();
    let iterations = 0; 
    const maxIterations = canvasW * canvasH; 

    while (queue.length > 0 && iterations < maxIterations) {
      const [x, y] = queue.shift();
      const pixelKey = `${x},${y}`;

      if (
        x < 0 ||
        x >= canvasW ||
        y < 0 ||
        y >= canvasH ||
        visited.has(pixelKey)
      ) {
        continue;
      }
      visited.add(pixelKey);

      const currentColor = getPixelColorFromData(data, x, y, canvasW);

      if (currentColor && colorsMatch(currentColor, targetColor)) {
        setPixelColorInData(data, x, y, canvasW, fillColor);
        queue.push([x + 1, y]);
        queue.push([x - 1, y]);
        queue.push([x, y + 1]);
        queue.push([x, y - 1]);
      }
      iterations++;
    }
    if (iterations >= maxIterations) {
        console.warn("Flood fill stopped: Maximum iterations reached. This might be a very large or complex area.");
    }
    ctx.putImageData(imageData, 0, 0);
  }
});
