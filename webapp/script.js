const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const imageUpload = document.getElementById("imageUpload");
const rowsInput = document.getElementById("rows");
const colsInput = document.getElementById("cols");

const gridColorInput = document.getElementById("gridColor");
const gridWidthInput = document.getElementById("gridWidth");
const gridWidthValue = document.getElementById("gridWidthValue");

let GRID_COLOR = "black";
let GRID_WIDTH = 1.5;

// Update when controls change
gridColorInput.addEventListener("change", (e) => {
  GRID_COLOR = e.target.value;
  redraw();
});

gridWidthInput.addEventListener("input", (e) => {
  GRID_WIDTH = parseFloat(e.target.value);
  gridWidthValue.textContent = GRID_WIDTH;
  redraw();
});

let state = {
  image: null,
  rows: 4,
  cols: 4,
  activeTile: null,
  completedTiles: new Set()
};


// Handle image upload
imageUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();

    img.onload = function () {
      state.image = img;
      drawImage();
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
});

function drawImage() {
  if (!state.image) return;

  canvas.width = state.image.width;
  canvas.height = state.image.height;

  redraw();
}

rowsInput.addEventListener("input", () => {
  state.rows = parseInt(rowsInput.value);
  redraw();
});

colsInput.addEventListener("input", () => {
  state.cols = parseInt(colsInput.value);
  redraw();
});

function drawGrid() {
  const { rows, cols } = state;

  const tileWidth = canvas.width / cols;
  const tileHeight = canvas.height / rows;

  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = GRID_WIDTH;

  // Vertical lines
  for (let c = 1; c < cols; c++) {
    const x = c * tileWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let r = 1; r < rows; r++) {
    const y = r * tileHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function redraw() {
  if (!state.image) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(state.image, 0, 0);
  drawGrid();
  drawFocus();
}

canvas.addEventListener("click", (e) => {
  if (!state.image) return;

  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  const col = Math.floor(x / (canvas.width / state.cols));
  const row = Math.floor(y / (canvas.height / state.rows));

  state.activeTile = { row, col };
  redraw();
});


canvas.addEventListener("dblclick", (e) => {
  if (!state.activeTile) return;

  const { row, col } = state.activeTile;
  const key = `${row},${col}`;

  if (state.completedTiles.has(key)) {
    state.completedTiles.delete(key);
  } else {
    state.completedTiles.add(key);
  }

  redraw();
});

function drawFocus() {
  if (!state.activeTile) return;

  const tileWidth = canvas.width / state.cols;
  const tileHeight = canvas.height / state.rows;

  const { row: activeRow, col: activeCol } = state.activeTile;

  // Dim everything
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw completed tiles **under** active tile
  state.completedTiles.forEach((key) => {
    const [r, c] = key.split(",").map(Number);
    // Skip active tile
    if (r === activeRow && c === activeCol) return;
    ctx.fillStyle = "rgba(0,255,0,0.2)";
    ctx.fillRect(c * tileWidth, r * tileHeight, tileWidth, tileHeight);
  });

  // Clear active tile area
  const x = activeCol * tileWidth;
  const y = activeRow * tileHeight;
  ctx.clearRect(x, y, tileWidth, tileHeight);

  // Draw active tile portion
  ctx.drawImage(
    state.image,
    x, y, tileWidth, tileHeight,
    x, y, tileWidth, tileHeight
  );

  // Active tile border
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, tileWidth, tileHeight);

  // Draw active tile overlay if it is also completed
  const activeKey = `${activeRow},${activeCol}`;
  if (state.completedTiles.has(activeKey)) {
    ctx.fillStyle = "rgba(0,255,0,0.2)";
    ctx.fillRect(x, y, tileWidth, tileHeight);
  }
}

document.addEventListener("keydown", (e) => {
  if (!state.activeTile) return;

  let { row, col } = state.activeTile;

  switch (e.key) {
    case "ArrowRight": col++; break;
    case "ArrowLeft": col--; break;
    case "ArrowUp": row--; break;
    case "ArrowDown": row++; break;
    case " ":
      e.preventDefault(); // stop page scrolling
      const key = `${row},${col}`;
      if (state.completedTiles.has(key)) {
        state.completedTiles.delete(key);
      } else {
        state.completedTiles.add(key);
      }
      redraw();
      return; // exit so we don’t move tile
    default: return;
  }

  // Clamp values
  row = Math.max(0, Math.min(state.rows - 1, row));
  col = Math.max(0, Math.min(state.cols - 1, col));

  state.activeTile = { row, col };
  redraw();
});