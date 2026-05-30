#!/usr/bin/env node
/** Normalize built-in body generation to 1254x1254 transparent PNG aligned to body_1254 anchor bbox. */
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REF = join(ROOT, "装扮", "pictures", "标准底图", "body_1254.png");
const SIZE = 1254;
const ALPHA_THRESHOLD = 12;
const OUTWARD_ALLOWANCE = 18;

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

function binaryMask(data, w, h, threshold) {
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      mask[y * w + x] = data[i + 3] > threshold ? 255 : 0;
    }
  }
  return mask;
}

function bbox(mask, w, h) {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : [minX, minY, maxX + 1, maxY + 1];
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

async function alignToReference(sourcePath, refBox) {
  let { data, w, h } = await loadRaw(sourcePath);
  data = removeBackground(data, w, h);

  let trimmed = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .trim({ threshold: ALPHA_THRESHOLD })
    .toBuffer();

  const trimMeta = await sharp(trimmed).metadata();
  const tw = trimMeta.width;
  const th = trimMeta.height;
  if (!tw || !th) throw new Error("empty source after trim");

  const refW = refBox[2] - refBox[0];
  const refH = refBox[3] - refBox[1];
  const targetW = refW + OUTWARD_ALLOWANCE * 2;
  const targetH = refH + OUTWARD_ALLOWANCE * 2;

  const scale = Math.max(targetW / tw, targetH / th);
  const nw = Math.round(tw * scale);
  const nh = Math.round(th * scale);

  const resized = await sharp(trimmed).resize(nw, nh, { fit: "fill" }).ensureAlpha().toBuffer();

  const refCx = (refBox[0] + refBox[2]) / 2;
  const refCy = (refBox[1] + refBox[3]) / 2;
  const left = Math.round(refCx - nw / 2);
  const top = Math.round(refCy - nh / 2);

  const canvas = sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  });

  return canvas.composite([{ input: resized, left, top }]).png().toBuffer();
}

async function clampToReference(pngBuffer, refData, refW, refH) {
  const { data, info } = await sharp(pngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  const w = info.width;
  const h = info.height;

  const refMask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ri = (y * refW + x) * 4;
      refMask[y * w + x] = refData[ri + 3] > ALPHA_THRESHOLD ? 255 : 0;
    }
  }

  const dilated = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let on = 0;
      for (let dy = -OUTWARD_ALLOWANCE; dy <= OUTWARD_ALLOWANCE && !on; dy++) {
        for (let dx = -OUTWARD_ALLOWANCE; dx <= OUTWARD_ALLOWANCE; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < w && ny < h && refMask[ny * w + nx]) {
            on = 255;
            break;
          }
        }
      }
      dilated[y * w + x] = on;
    }
  }

  for (let i = 0; i < w * h; i++) {
    if (!dilated[i]) out[i * 4 + 3] = 0;
  }

  return sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

async function main() {
  const { source, dest } = parseArgs();
  if (!source || !dest) {
    console.error("Usage: node normalize_body_builtin.mjs --source PATH --dest PATH");
    process.exit(1);
  }

  mkdirSync(dirname(dest), { recursive: true });
  const ref = await loadRaw(REF);
  const refMask = binaryMask(ref.data, ref.w, ref.h, ALPHA_THRESHOLD);
  const refBox = bbox(refMask, ref.w, ref.h);
  if (!refBox) {
    console.error("reference body bbox empty");
    process.exit(1);
  }

  let png = await alignToReference(source, refBox);
  png = await clampToReference(png, ref.data, ref.w, ref.h);
  await sharp(png).toFile(dest);
  console.log(dest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
