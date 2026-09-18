import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { PNG } from "pngjs";
import pngToIco from "png-to-ico";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

function setPixelSafe(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = color[0];
  png.data[idx + 1] = color[1];
  png.data[idx + 2] = color[2];
  png.data[idx + 3] = color[3];
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const v0x = cx - ax;
  const v0y = cy - ay;
  const v1x = bx - ax;
  const v1y = by - ay;
  const v2x = px - ax;
  const v2y = py - ay;

  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;

  const denom = dot00 * dot11 - dot01 * dot01;
  if (denom === 0) return false;
  const inv = 1 / denom;
  const u = (dot11 * dot02 - dot01 * dot12) * inv;
  const v = (dot00 * dot12 - dot01 * dot02) * inv;

  return u >= 0 && v >= 0 && u + v <= 1;
}

function drawLine(png, x0, y0, x1, y1, color) {
  let dx = Math.abs(x1 - x0);
  let sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0);
  let sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    setPixelSafe(png, x0, y0, color);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function drawCircle(png, cx, cy, r, color) {
  for (let y = -r; y <= r; y += 1) {
    for (let x = -r; x <= r; x += 1) {
      if (x * x + y * y <= r * r) {
        setPixelSafe(png, cx + x, cy + y, color);
      }
    }
  }
}

async function createIcon(size) {
  const png = new PNG({ width: size, height: size });

  const c1 = [22, 163, 74];
  const c2 = [34, 197, 94];
  const circuit = [236, 253, 245, 235];

  const ex = size * 0.42;
  const ey = size * 0.5;
  const rx = size * 0.28;
  const ry = size * 0.24;

  const tAx = Math.round(size * 0.56);
  const tAy = Math.round(size * 0.28);
  const tBx = Math.round(size * 0.93);
  const tBy = Math.round(size * 0.5);
  const tCx = Math.round(size * 0.56);
  const tCy = Math.round(size * 0.72);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x - ex) / rx;
      const dy = (y - ey) / ry;
      const inEllipse = dx * dx + dy * dy <= 1;
      const inTip = pointInTriangle(x, y, tAx, tAy, tBx, tBy, tCx, tCy);
      const inLeaf = inEllipse || inTip;

      if (!inLeaf) {
        setPixelSafe(png, x, y, [0, 0, 0, 0]);
        continue;
      }

      const g = Math.min(1, Math.max(0, (x / (size - 1)) * 0.7 + (y / (size - 1)) * 0.3));
      const leafColor = [
        Math.round(c1[0] + (c2[0] - c1[0]) * g),
        Math.round(c1[1] + (c2[1] - c1[1]) * g),
        Math.round(c1[2] + (c2[2] - c1[2]) * g),
        255,
      ];
      setPixelSafe(png, x, y, leafColor);
    }
  }

  // Central vein.
  drawLine(
    png,
    Math.round(size * 0.17),
    Math.round(size * 0.52),
    Math.round(size * 0.82),
    Math.round(size * 0.5),
    circuit
  );

  const circuitBaseX = Math.round(size * 0.4);
  const circuitBaseY = Math.round(size * 0.5);
  const routes = [
    [Math.round(size * 0.04), 0, Math.round(size * 0.22), -Math.round(size * 0.12)],
    [Math.round(size * 0.12), 0, Math.round(size * 0.3), 0],
    [Math.round(size * 0.04), 0, Math.round(size * 0.22), Math.round(size * 0.12)],
  ];

  for (const [sx, sy, ex, ey] of routes) {
    drawLine(png, circuitBaseX + sx, circuitBaseY + sy, circuitBaseX + ex, circuitBaseY + ey, circuit);
    drawCircle(png, circuitBaseX + ex, circuitBaseY + ey, Math.max(1, Math.round(size * 0.045)), circuit);
  }

  return png;
}

function buildSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="leafGradient" x1="18" y1="18" x2="112" y2="108" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#16a34a"/>
      <stop offset="1" stop-color="#22c55e"/>
    </linearGradient>
  </defs>
  <path d="M14 64C16 38 37 18 63 18C83 18 101 31 114 51C116 55 116 73 114 77C101 97 83 110 63 110C37 110 16 90 14 64Z" fill="url(#leafGradient)"/>
  <path d="M22 68L102 64" stroke="#ECFDF5" stroke-width="6" stroke-linecap="round"/>
  <path d="M50 64L74 48" stroke="#ECFDF5" stroke-width="5" stroke-linecap="round"/>
  <path d="M58 64L84 64" stroke="#ECFDF5" stroke-width="5" stroke-linecap="round"/>
  <path d="M50 64L74 80" stroke="#ECFDF5" stroke-width="5" stroke-linecap="round"/>
  <circle cx="74" cy="48" r="4" fill="#ECFDF5"/>
  <circle cx="84" cy="64" r="4" fill="#ECFDF5"/>
  <circle cx="74" cy="80" r="4" fill="#ECFDF5"/>
</svg>`;
}

async function run() {
  await fs.mkdir(publicDir, { recursive: true });

  const icon32 = await createIcon(32);
  const icon64 = await createIcon(64);

  const p32 = path.join(publicDir, "favicon-32x32.png");
  const p64 = path.join(publicDir, "favicon-64x64.png");
  const pIco = path.join(publicDir, "favicon.ico");
  const pSvg = path.join(publicDir, "favicon.svg");

  await fs.writeFile(p32, PNG.sync.write(icon32));
  await fs.writeFile(p64, PNG.sync.write(icon64));
  await fs.writeFile(pSvg, buildSvg(), "utf8");

  const icoBuffer = await pngToIco([p32, p64]);
  await fs.writeFile(pIco, icoBuffer);

  console.log("Generated favicon files:");
  console.log("-", p32);
  console.log("-", p64);
  console.log("-", pIco);
  console.log("-", pSvg);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
