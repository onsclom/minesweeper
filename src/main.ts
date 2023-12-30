/* CONSTANTS */
const WIDTH = 9;
const HEIGHT = 9;
const MINES = 10;
const CELL_BORDER = 1;
const CELL_SIZE = 32;

/* GAME STATE */
const revealed = new Set<number>();
const flags = new Set<number>();
const bombs = new Set<number>();
while (bombs.size < MINES)
  bombs.add(Math.floor(Math.random() * WIDTH * HEIGHT));

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
requestAnimationFrame(function tick() {
  const canvasRect = canvas.getBoundingClientRect(); // changes on resize
  canvas.width = canvasRect.width * devicePixelRatio;
  canvas.height = canvasRect.height * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  /* RENDER */
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvasRect.width, canvasRect.height);

  ctx.font = "20px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const grid = centeredGrid();
  const [cb, cs] = [CELL_BORDER, CELL_SIZE];
  ctx.save();
  ctx.translate(grid.left, grid.top);
  for (let cell = 0; cell < WIDTH * HEIGHT; cell++) {
    const { x, y } = { x: cell % WIDTH, y: Math.floor(cell / WIDTH) };
    ctx.save();
    ctx.translate(x * CELL_SIZE, y * CELL_SIZE);
    ctx.fillStyle = "#ddd";
    ctx.fillRect(cb, cb, cs - cb * 2, cs - cb * 2);
    if (bombs.has(cell)) ctx.fillText(`💣`, cs / 2, cs / 2);
    else {
      const bombs = bombCount(cell);
      if (bombs > 0) {
        ctx.fillStyle = "black";
        ctx.fillText(bombs.toString(), cs / 2, cs / 2);
      }
    }
    if (!revealed.has(cell)) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(cb, cb, cs - cb * 2, cs - cb * 2);
      if (flags.has(cell)) ctx.fillText(`🚩`, cs / 2, cs / 2);
    }
    ctx.restore();
  }
  ctx.restore();

  const emoji = {
    playing: "😀",
    dead: "💀",
    won: "🎉",
  }[determineGameState()];
  ctx.fillText(emoji, canvasRect.width / 2, 20);

  requestAnimationFrame(tick);
});

/* INPUT HANDLING */

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  if (determineGameState() !== "playing") return;
  const cell = screenPosToCell(event.clientX, event.clientY);
  if (cell === null) return;
  if (flags.has(cell)) flags.delete(cell);
  else flags.add(cell);
});

document.onclick = (e) => {
  if (determineGameState() !== "playing") window.location.reload();
  const cell = screenPosToCell(e.clientX, e.clientY);
  if (cell === null) return;
  revealed.add(cell);
  if (bombs.has(cell)) bombs.forEach((bomb) => revealed.add(bomb));
  const bombsOnPos = bombCount(cell);
  if (bombsOnPos === 0) floodFill(cell);
};

/* HELPER FUNCTIONS */

function bombCount(cell: number) {
  const { x, y } = { x: cell % WIDTH, y: Math.floor(cell / WIDTH) };
  let count = 0;
  for (let y2 = y - 1; y2 <= y + 1; y2++)
    for (let x2 = x - 1; x2 <= x + 1; x2++) {
      const inBounds = x2 >= 0 && x2 < WIDTH && y2 >= 0 && y2 < HEIGHT;
      if (!inBounds) continue;
      if (bombs.has(y2 * WIDTH + x2)) count++;
    }
  return count;
}

function centeredGrid() {
  const canvasRect = canvas.getBoundingClientRect();
  const width = WIDTH * CELL_SIZE;
  const height = HEIGHT * CELL_SIZE;
  return {
    left: (canvasRect.width - width) / 2,
    top: (canvasRect.height - height) / 2,
  };
}

function floodFill(cell: number) {
  const { x, y } = { x: cell % WIDTH, y: Math.floor(cell / WIDTH) };
  for (let y2 = y - 1; y2 <= y + 1; y2++)
    for (let x2 = x - 1; x2 <= x + 1; x2++) {
      const inBounds = x2 >= 0 && x2 < WIDTH && y2 >= 0 && y2 < HEIGHT;
      if (!inBounds) continue;
      const newCell = y2 * WIDTH + x2;
      const bombsOnPos = bombCount(newCell);
      if (bombsOnPos === 0 && !revealed.has(newCell)) {
        revealed.add(newCell);
        floodFill(newCell);
      } else if (bombsOnPos > 0) revealed.add(newCell);
    }
}

function determineGameState() {
  for (let bomb of bombs) if (revealed.has(bomb)) return "dead";
  if (revealed.size === WIDTH * HEIGHT - MINES) return "won";
  return "playing";
}

function screenPosToCell(x: number, y: number) {
  const grid = centeredGrid();
  const gridX = Math.floor((x - grid.left) / CELL_SIZE);
  const gridY = Math.floor((y - grid.top) / CELL_SIZE);
  if (gridX < 0 || gridX >= WIDTH || gridY < 0 || gridY >= HEIGHT) return null;
  return gridY * WIDTH + gridX;
}
