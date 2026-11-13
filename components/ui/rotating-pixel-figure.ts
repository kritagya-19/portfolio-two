import { BUILTIN_FRAMES } from "./loading-animation";

const GW = 66;
const GH = 53;
const CELL_ASPECT = 14.65 / 10.8;
const FADE_ROWS = 9;

const hsh = (x: number, y: number) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000 / 1000;

interface DecodedCache {
  frames: Uint8Array[];
  box: { x0: number; y0: number; x1: number; y1: number };
  colsC: number;
  rowsC: number;
}

let cachedData: DecodedCache | null = null;

export function getDecodedFrames(): DecodedCache {
  if (cachedData) return cachedData;

  const box = { x0: GW, y0: GH, x1: 0, y1: 0 };
  const frames: Uint8Array[] = BUILTIN_FRAMES.map((b64) => {
    const bin = atob(b64);
    const bits = new Uint8Array(GW * GH);
    for (let i = 0; i < bits.length; i++) {
      const on = (bin.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1;
      bits[i] = on;
      if (on) {
        const x = i % GW;
        const y = (i / GW) | 0;
        if (x < box.x0) box.x0 = x;
        if (x > box.x1) box.x1 = x;
        if (y < box.y0) box.y0 = y;
        if (y > box.y1) box.y1 = y;
      }
    }
    return bits;
  });

  cachedData = {
    frames,
    box,
    colsC: box.x1 - box.x0 + 1,
    rowsC: box.y1 - box.y0 + 1,
  };
  return cachedData;
}

export interface RotatingPixelFigureOptions {
  color?: string;
  fps?: number;
  scale?: number;
}

export function mountRotatingPixelFigure(
  container: HTMLElement,
  options: RotatingPixelFigureOptions = {}
): { destroy: () => void } {
  const { frames, box, colsC, rowsC } = getDecodedFrames();
  const n = frames.length;

  const color = options.color || "#ff3b1d";
  const fps = options.fps || 20;
  const frameInterval = 1000 / fps;
  const figureScale = options.scale || 0.88;

  // Create canvas if not already inside container
  let canvas = container.querySelector("canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.imageRendering = "pixelated";
    // @ts-ignore
    canvas.style.webkitImageRendering = "pixelated";
    container.appendChild(canvas);
  } else {
    canvas.style.imageRendering = "pixelated";
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy: () => {} };

  let rafId = 0;
  let alive = true;
  let isVisible = true;
  let currentFrame = -1;

  function updateSize() {
    if (!canvas || !alive) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    const w = Math.max(rect.width, 32);
    const h = Math.max(rect.height, 32);

    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      if (currentFrame >= 0) draw(currentFrame);
    }
  }

  updateSize();
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateSize) : null;
  ro?.observe(container);

  const io = typeof IntersectionObserver !== "undefined"
    ? new IntersectionObserver((entries) => {
        if (entries[0]) {
          isVisible = entries[0].isIntersecting;
        }
      })
    : null;
  io?.observe(container);

  function draw(frameIdx: number) {
    if (!canvas || !ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    if (W === 0 || H === 0) return;

    ctx.clearRect(0, 0, W, H);

    // Compute cell dimensions to fit figureScale of canvas
    let ch = (H * figureScale) / rowsC;
    let cw = ch / CELL_ASPECT;
    if (colsC * cw > W * figureScale) {
      cw = (W * figureScale) / colsC;
      ch = cw * CELL_ASPECT;
    }

    const ox = (W - colsC * cw) / 2 - box.x0 * cw;
    const oy = (H - rowsC * ch) / 2 - box.y0 * ch;

    const bits = frames[((frameIdx % n) + n) % n];
    ctx.fillStyle = color;

    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const i = y * GW + x;
        if (!bits[i]) continue;
        // Dither dissolve on bottom edge
        if (y > box.y1 - FADE_ROWS && hsh(x * 7 + 3, y * 11 + 5) > (box.y1 - y + 1) / (FADE_ROWS + 1)) {
          continue;
        }

        const px = Math.round(ox + x * cw);
        const py = Math.round(oy + y * ch);
        const pw = Math.round(ox + (x + 1) * cw) - px;
        const ph = Math.round(oy + (y + 1) * ch) - py;
        ctx.fillRect(px, py, pw, ph);
      }
    }
  }

  // Initial draw
  currentFrame = Math.floor((performance.now() / 1000) * fps) % n;
  draw(currentFrame);

  function tick(now: number) {
    if (!alive) return;

    if (isVisible) {
      const frame = Math.floor((now / 1000) * fps) % n;
      if (frame !== currentFrame) {
        currentFrame = frame;
        draw(currentFrame);
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return {
    destroy() {
      alive = false;
      cancelAnimationFrame(rafId);
      ro?.disconnect();
      io?.disconnect();
      if (canvas && canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    },
  };
}

export function renderSeparatedFigure(
  canvas: HTMLCanvasElement,
  progress: number,
  color: string = "#ff3b1d",
  frameIndex: number = 0
): void {
  const dpr = window.devicePixelRatio || 1;
  const W = Math.round(canvas.clientWidth * dpr);
  const H = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, W, H);
  if (progress >= 0.99) return;

  const { frames, box, colsC, rowsC } = getDecodedFrames();
  const n = frames.length;
  const k = Math.abs(frameIndex) % n;
  const a = frames[k];
  const b = frames[(k + 1) % n];
  const mix = k >= n - 4 ? (k - (n - 4) + 1) / 4 : 0;

  const figureHeight = Math.min(W * 0.9, H * 0.52);
  let ch = figureHeight / rowsC;
  let cw = ch / CELL_ASPECT;
  if (colsC * cw > W * 0.75) {
    cw = (W * 0.75) / colsC;
    ch = cw * CELL_ASPECT;
  }
  const ox = W / 2 - ((box.x0 + box.x1 + 1) / 2) * cw;
  const oy = H / 2 - ((box.y0 + box.y1 + 1) / 2) * ch;

  const mn = Math.min(W, H);
  const spread = 1.35;
  ctx.fillStyle = color;

  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const i = y * GW + x;
      if (!(mix && hsh(x, y) < mix ? b[i] : a[i])) continue;
      if (y > box.y1 - FADE_ROWS && hsh(x * 7 + 3, y * 11 + 5) > (box.y1 - y + 1) / (FADE_ROWS + 1)) continue;

      let lp = 0;
      if (progress > 0) {
        lp = Math.max(0, Math.min(1, progress * 1.5 - hsh(x * 3 + 1, y * 5 + 2) * 0.5));
        lp = lp * lp * (3 - 2 * lp);
      }
      if (lp >= 0.99) continue;

      if (lp === 0) {
        const x0 = Math.round(ox + x * cw);
        const y0 = Math.round(oy + y * ch);
        ctx.globalAlpha = 1;
        ctx.fillRect(x0, y0, Math.round(ox + (x + 1) * cw) - x0, Math.round(oy + (y + 1) * ch) - y0);
        continue;
      }

      const ang = hsh(x, y) * 6.2832;
      const dist = lp * (0.04 + hsh(y + 7, x + 3) * 0.46) * mn * spread;
      const sz = Math.max(0, 1 - lp * 0.6);
      ctx.globalAlpha = Math.max(0, 1 - lp * 0.92);
      ctx.fillRect(
        ox + x * cw + Math.cos(ang) * dist + lp * W * 0.02,
        oy + y * ch + Math.sin(ang) * dist - lp * lp * H * 0.1,
        cw * sz,
        ch * sz
      );
    }
  }
  ctx.globalAlpha = 1;
}

