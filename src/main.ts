// USE URL PARAMS FOR SIZE AND MINECOUNT ?!

/* CONSTANTS */
const WIDTH = 9;
const HEIGHT = 9;
const MINES = 10;
const EMOJI_BOMB = `💣`;
const EMOJI_FLAG = `🚩`;

const CELL_BORDER = 1;
const CELL_SIZE = 32;

// const DIFFICULTIES = {
//   beginner: {
//     width: 9,
//     height: 9,
//     mines: 10,
//   },
//   intermediate: {
//     width: 16,
//     height: 16,
//     mines: 40,
//   },
//   expert: {
//     width: 30,
//     height: 16,
//     mines: 99,
//   },
// };

/* GAME STATE */
// generate bombs
const bombs = new Set<number>();
const revealed = new Set<number>();
let a = 4;
while (bombs.size < MINES)
  bombs.add(Math.floor(Math.random() * WIDTH * HEIGHT));

const canvas = document.getElementById("canvas");
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Canvas not found");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas context not found");

requestAnimationFrame(function tick() {
  const canvasRect = canvas.getBoundingClientRect();

  /* SETUP */

  // handle high dpi
  // const newWidth = canvasRect.width * devicePixelRatio;
  // const newHeight = canvasRect.height * devicePixelRatio;
  // if (canvas.width !== newWidth || canvas.height !== newHeight) {
  canvas.width = canvasRect.width * devicePixelRatio;
  canvas.height = canvasRect.height * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  // }

  // computed state
  // const won = revealed.size === WIDTH * HEIGHT - MINES;

  /* DRAW */
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvasRect.width, canvasRect.height);
  ctx.font = "20px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // draw grid
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      ctx.fillStyle = "#ddd";
      ctx.fillRect(
        x * CELL_SIZE + CELL_BORDER,
        y * CELL_SIZE + CELL_BORDER,
        CELL_SIZE - CELL_BORDER * 2,
        CELL_SIZE - CELL_BORDER * 2
      );
      if (bombs.has(y * WIDTH + x))
        ctx.fillText(
          EMOJI_BOMB,
          x * CELL_SIZE + CELL_SIZE / 2,
          y * CELL_SIZE + CELL_SIZE / 2
        );
      else {
        const neighborCount = bombCount(x, y);
        if (neighborCount > 0) {
          ctx.fillStyle = "black";
          ctx.fillText(
            neighborCount.toString(),
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2
          );
        }
      }
      if (!revealed.has(y * WIDTH + x)) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(
          x * CELL_SIZE + CELL_BORDER,
          y * CELL_SIZE + CELL_BORDER,
          CELL_SIZE - CELL_BORDER * 2,
          CELL_SIZE - CELL_BORDER * 2
        );
      }
    }
  }
  requestAnimationFrame(tick);
});

function bombCount(x: number, y: number) {
  let count = 0;
  for (let y2 = y - 1; y2 <= y + 1; y2++)
    for (let x2 = x - 1; x2 <= x + 1; x2++)
      if (bombs.has(y2 * WIDTH + x2)) count++;
  return count;
}

/* HANDLE INPUT EVENTS */

document.body.onclick = (e) => {
  const x = Math.floor(e.clientX / CELL_SIZE);
  const y = Math.floor(e.clientY / CELL_SIZE);
  const cell = y * WIDTH + x;
  // if (bombs.has(cell)) {
  //   alert("Game over!");
  //   location.reload();
  // } else {
  revealed.add(cell);
  const bombsOnPos = bombCount(x, y);
  if (bombsOnPos === 0) floodFill(x, y);

  canvas.style.cursor = "default";
};

function floodFill(x: number, y: number) {
  for (let y2 = y - 1; y2 <= y + 1; y2++)
    for (let x2 = x - 1; x2 <= x + 1; x2++) {
      const inBounds = x2 >= 0 && x2 < WIDTH && y2 >= 0 && y2 < HEIGHT;
      if (!inBounds) continue;
      const cell = y2 * WIDTH + x2;
      const bombsOnPos = bombCount(x2, y2);
      if (bombsOnPos === 0 && !revealed.has(cell)) {
        revealed.add(cell);
        floodFill(x2, y2);
      } else if (bombsOnPos > 0) revealed.add(cell);
    }
}

document.body.onpointermove = (e) => {
  const x = Math.floor(e.clientX / CELL_SIZE);
  const y = Math.floor(e.clientY / CELL_SIZE);

  // change to pointer if on unopened
  if (!revealed.has(y * WIDTH + x)) canvas.style.cursor = "pointer";
  else canvas.style.cursor = "default";
};
