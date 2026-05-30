#!/usr/bin/env node
/**
 * Align built-in head accessory generation onto head_1254.png.
 * Keeps the original head anchor; composites decoration pixels only.
 */
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REF = join(ROOT, "装扮", "pictures", "标准底图", "head_1254.png");
const SIZE = 1254;
const ALPHA_THRESHOLD = 12;
const DIFF_THRESHOLD = 28;
const HAT_WIDTH_SCALE = 1.08;
const HAT_TOP_OFFSET = -0.42;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { source: null, dest: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source") out.source = resolve(args[++i]);
    else if (args[i] === "--dest") out.dest = resolve(args[++i]);
  }
  return out;
}

async function loadRaw(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: Buffer.from(data), w: info.width, h: info.height };
}

function isBackground(r, g, b, a) {
  if (a < 16) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 28 && max > 210) return true;
  if (max - min < 20 && max > 180 && min > 150) return true;
  return false;
}

function removeBackground(data, w, h) {
  const out = Buffer.from(data);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (isBackground(out[o], out[o + 1], out[o + 2], out[o + 3])) out[o + 3] = 0;
  }
  return out;
}

function bboxFromAlpha(data, w, h, threshold = ALPHA_THRESHOLD) {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > threshold) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return maxX < 0 ? null : [minX, minY, maxX + 1, maxY + 1];
}

function cropRaw(data, w, h, box) {
  const [x0, y0, x1, y1] = box;
  const cw = x1 - x0;
  const ch = y1 - y0;
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = ((y0 + y) * w + (x0 + x)) * 4;
      const di = (y * cw + x) * 4;
      out[di] = data[si];
      out[di + 1] = data[si + 1];
      out[di + 2] = data[si + 2];
      out[di + 3] = data[si + 3];
    }
  }
  return { data: out, w: cw, h: ch };
}

async function resizeRaw(data, w, h, nw, nh) {
  const png = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .resize(nw, nh, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data: Buffer.from(png.data), w: png.info.width, h: png.info.height };
}

function placeOnCanvas(raw, w, h, left, top) {
  const canvas = Buffer.alloc(SIZE * SIZE * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cx = left + x;
      const cy = top + y;
      if (cx < 0 || cy < 0 || cx >= SIZE || cy >= SIZE) continue;
      const si = (y * w + x) * 4;
      const di = (cy * SIZE + cx) * 4;
      const a = raw[si + 3];
      if (a <= ALPHA_THRESHOLD) continue;
      canvas[di] = raw[si];
      canvas[di + 1] = raw[si + 1];
      canvas[di + 2] = raw[si + 2];
      canvas[di + 3] = a;
    }
  }
  return canvas;
}

function maxChannelDiff(a, b) {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

function compositeOntoBase(base, overlay) {
  const out = Buffer.from(base);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const o = i * 4;
    const ba = base[o + 3];
    const oa = overlay[o + 3];
    if (oa <= ALPHA_THRESHOLD) continue;

    const outsideBase = ba <= ALPHA_THRESHOLD;
    const rgbDiff = maxChannelDiff(base.subarray(o, o + 3), overlay.subarray(o, o + 3));
    const decoration = outsideBase || (ba > ALPHA_THRESHOLD && rgbDiff >= DIFF_THRESHOLD);
    if (!decoration) continue;

    const alpha = Math.round((oa / 255) * 255);
    if (ba > ALPHA_THRESHOLD && alpha < 255) {
      const srcA = alpha / 255;
      const dstA = ba / 255;
      const outA = srcA + dstA * (1 - srcA);
      out[o] = Math.round((overlay[o] * srcA + base[o] * dstA * (1 - srcA)) / outA);
      out[o + 1] = Math.round((overlay[o + 1] * srcA + base[o + 1] * dstA * (1 - srcA)) / outA);
      out[o + 2] = Math.round((overlay[o + 2] * srcA + base[o + 2] * dstA * (1 - srcA)) / outA);
      out[o + 3] = Math.round(outA * 255);
    } else {
      out[o] = overlay[o];
      out[o + 1] = overlay[o + 1];
      out[o + 2] = overlay[o + 2];
      out[o + 3] = alpha;
    }
  }
  return out;
}

async function alignAccessory(sourceData, sw, sh, refBox) {
  const [rx, ry, rx1, ry1] = refBox;
  const rw = rx1 - rx;
  const rh = ry1 - ry;
  const srcBox = bboxFromAlpha(sourceData, sw, sh);
  if (!srcBox) throw new Error("No visible pixels in source");

  let { data, w, h } = cropRaw(sourceData, sw, sh, srcBox);
  const targetW = Math.round(rw * HAT_WIDTH_SCALE);
  const targetH = Math.round((h / w) * targetW);
  ({ data, w, h } = await resizeRaw(data, w, h, targetW, targetH));

  const left = Math.round(rx + (rw - w) / 2);
  const top = Math.round(ry + rh * HAT_TOP_OFFSET);
  return placeOnCanvas(data, w, h, left, top);
}

async function main() {
  const { source, dest } = parseArgs();
  if (!source || !dest) {
    console.error("Usage: node normalize_head_builtin.mjs --source PATH --dest PATH");
    process.exit(1);
  }

  mkdirSync(dirname(dest), { recursive: true });
  const ref = await loadRaw(REF);
  const refBox = bboxFromAlpha(ref.data, ref.w, ref.h);
  if (!refBox) throw new Error("Reference head has no alpha bbox");

  let { data, w, h } = await loadRaw(source);
  data = removeBackground(data, w, h);
  const overlayCanvas = await alignAccessory(data, w, h, refBox);
  const final = compositeOntoBase(ref.data, overlayCanvas);
  await sharp(final, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toFile(dest);
  console.log(dest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
