#!/usr/bin/env node
/** Normalize built-in legs generation to 1254x1254 transparent PNG aligned to legs_1254. */
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REF = join(ROOT, "装扮", "pictures", "标准底图", "legs_1254.png");
const SIZE = 1254;
const PAD = 115;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { source: null, dest: null, food: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source") out.source = resolve(args[++i]);
    else if (args[i] === "--dest") out.dest = resolve(args[++i]);
    else if (args[i] === "--food") out.food = args[++i];
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

async function fitTo1254(data, w, h) {
  const content = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();

  const meta = await sharp(content).metadata();
  const cw = meta.width;
  const ch = meta.height;

  const inner = SIZE - PAD * 2;
  const scale = Math.min(inner / cw, inner / ch, 1);
  const nw = Math.round(cw * scale);
  const nh = Math.round(ch * scale);

  const resized = await sharp(content)
    .resize(nw, nh, { fit: "inside" })
    .ensureAlpha()
    .toBuffer();

  const canvas = sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  });

  const left = Math.round((SIZE - nw) / 2);
  const top = Math.round((SIZE - nh) / 2);
  return canvas.composite([{ input: resized, left, top }]).png().toBuffer();
}

async function clampToReference(pngBuffer, refData, refW, refH) {
  const { data, info } = await sharp(pngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  const w = info.width;
  const h = info.height;
  const allowance = 22;

  const refMask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ri = (y * refW + x) * 4;
      refMask[y * w + x] = refData[ri + 3] > 12 ? 255 : 0;
    }
  }

  const dilated = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let on = 0;
      for (let dy = -allowance; dy <= allowance && !on; dy++) {
        for (let dx = -allowance; dx <= allowance; dx++) {
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
    console.error("Usage: node normalize_legs_builtin.mjs --source PATH --dest PATH [--food NAME]");
    process.exit(1);
  }

  mkdirSync(dirname(dest), { recursive: true });
  const ref = await loadRaw(REF);
  let { data, w, h } = await loadRaw(source);
  data = removeBackground(data, w, h);
  let png = await fitTo1254(data, w, h);
  png = await clampToReference(png, ref.data, ref.w, ref.h);
  await sharp(png).toFile(dest);
  console.log(dest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
