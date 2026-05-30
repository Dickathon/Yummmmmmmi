#!/usr/bin/env node
/** Normalize built-in legs generation: align content bbox to legs_1254 anchor. */
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REF = join(ROOT, "装扮", "pictures", "标准底图", "legs_1254.png");
const SIZE = 1254;
const ALPHA_THRESHOLD = 12;
const OUTWARD_ALLOWANCE = 22;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { source: null, dest: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source") out.source = resolve(args[++i]);
    else if (args[i] === "--dest") out.dest = resolve(args[++i]);
  }
  return out;
}

function contentBbox(rgba, w, h) {
  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = rgba[(y * w + x) * 4 + 3];
      if (a > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return minX <= maxX ? [minX, minY, maxX, maxY] : null;
}

function isBackground(r, g, b, a) {
  if (a < 16) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 28 && max > 210) return true;
  if (max - min < 20 && max > 180 && min > 150) return true;
  if (r + g + b < 36) return true;
  return false;
}

async function loadKeyedRgba(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const si = i * 4;
    const r = data[si];
    const g = data[si + 1];
    const b = data[si + 2];
    const a = data[si + 3];
    out[si] = r;
    out[si + 1] = g;
    out[si + 2] = b;
    out[si + 3] = isBackground(r, g, b, a) ? 0 : a;
  }
  return { data: out, w: info.width, h: info.height };
}

function cropRgba(rgba, w, h, bbox) {
  const [x0, y0, x1, y1] = bbox;
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = ((y0 + y) * w + (x0 + x)) * 4;
      const di = (y * cw + x) * 4;
      out[di] = rgba[si];
      out[di + 1] = rgba[si + 1];
      out[di + 2] = rgba[si + 2];
      out[di + 3] = rgba[si + 3];
    }
  }
  return { data: out, w: cw, h: ch };
}

async function resizeRgba(src, targetW, targetH) {
  const png = new PNG({ width: src.w, height: src.h });
  src.data.copy(png.data);
  const buf = await sharp(PNG.sync.write(png))
    .resize(targetW, targetH, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer();
  return Buffer.from(buf);
}

function dilateMask(mask, w, h, radius) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let on = 0;
      for (let dy = -radius; dy <= radius && !on; dy++) {
        for (let dx = -radius; dx <= radius && !on; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < w && ny < h && mask[ny * w + nx]) on = 1;
        }
      }
      out[y * w + x] = on;
    }
  }
  return out;
}

async function alignToReference(sourcePath, refPath) {
  const refLoaded = PNG.sync.read(readFileSync(refPath));
  const refRgba = refLoaded.data;
  const refW = refLoaded.width;
  const refH = refLoaded.height;
  const refBox = contentBbox(refRgba, refW, refH);
  if (!refBox) throw new Error("Reference has no content bbox");

  const src = await loadKeyedRgba(sourcePath);
  const srcBox = contentBbox(src.data, src.w, src.h);
  if (!srcBox) throw new Error("Source has no content bbox");

  const cropped = cropRgba(src.data, src.w, src.h, srcBox);
  const [tx0, ty0, tx1, ty1] = refBox;
  const targetW = tx1 - tx0 + 1;
  const targetH = ty1 - ty0 + 1;
  const scaled = await resizeRgba(cropped, targetW, targetH);

  const canvas = Buffer.alloc(SIZE * SIZE * 4);
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const si = (y * targetW + x) * 4;
      const alpha = scaled[si + 3];
      if (alpha <= ALPHA_THRESHOLD) continue;
      const dx = tx0 + x;
      const dy = ty0 + y;
      if (dx < 0 || dy < 0 || dx >= SIZE || dy >= SIZE) continue;
      const di = (dy * SIZE + dx) * 4;
      canvas[di] = scaled[si];
      canvas[di + 1] = scaled[si + 1];
      canvas[di + 2] = scaled[si + 2];
      canvas[di + 3] = alpha;
    }
  }

  const refMask = new Uint8Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    refMask[i] = refRgba[i * 4 + 3] > ALPHA_THRESHOLD ? 1 : 0;
  }
  const allowed = dilateMask(refMask, SIZE, SIZE, OUTWARD_ALLOWANCE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (!allowed[i]) canvas[i * 4 + 3] = 0;
  }

  return sharp(canvas, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toBuffer();
}

async function main() {
  const { source, dest } = parseArgs();
  if (!source || !dest) {
    console.error("Usage: node normalize_legs_builtin.mjs --source PATH --dest PATH");
    process.exit(1);
  }

  mkdirSync(dirname(dest), { recursive: true });
  const png = await alignToReference(source, REF);
  await sharp(png).toFile(dest);
  console.log(dest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
