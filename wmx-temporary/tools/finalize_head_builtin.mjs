#!/usr/bin/env node
/**
 * Finalize head AI output: key black background, resize to 1254 if needed, overlay
 * decoration pixels onto head_1254.png. No crop/clamp — anchor comes from reference base.
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
const BLACK_THRESHOLD = 36;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { source: null, dest: null, reference: REF };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source") out.source = resolve(args[++i]);
    else if (args[i] === "--dest") out.dest = resolve(args[++i]);
    else if (args[i] === "--reference") out.reference = resolve(args[++i]);
  }
  return out;
}

async function loadRaw(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: Buffer.from(data), w: info.width, h: info.height };
}

function keyOutBackground(data, w, h) {
  const out = Buffer.from(data);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    const r = out[o];
    const g = out[o + 1];
    const b = out[o + 2];
    const a = out[o + 3];
    if (r + g + b < BLACK_THRESHOLD) out[o + 3] = 0;
    else if (a < 16) out[o + 3] = 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 28 && max > 210) out[o + 3] = 0;
  }
  return out;
}

async function resizeTo1254(data, w, h) {
  if (w === SIZE && h === SIZE) return data;
  const png = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .resize(SIZE, SIZE, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return Buffer.from(png.data);
}

function maxChannelDiff(a, b) {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

function buildOverlayMask(base, candidate, w, h) {
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    const ba = base[o + 3];
    const ca = candidate[o + 3];
    if (ca <= ALPHA_THRESHOLD) continue;
    const outsideBase = ba <= ALPHA_THRESHOLD;
    const rgbDiff = maxChannelDiff(base.subarray(o, o + 3), candidate.subarray(o, o + 3));
    if (outsideBase || (ba > ALPHA_THRESHOLD && rgbDiff >= DIFF_THRESHOLD)) mask[i] = 255;
  }
  return mask;
}

function compositeOntoBase(base, candidate, mask) {
  const out = Buffer.from(base);
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (!mask[i]) continue;
    const o = i * 4;
    const ca = candidate[o + 3];
    if (ca <= ALPHA_THRESHOLD) continue;
    const ba = base[o + 3];
    const srcA = ca / 255;
    if (ba > ALPHA_THRESHOLD && srcA < 1) {
      const dstA = ba / 255;
      const outA = srcA + dstA * (1 - srcA);
      out[o] = Math.round((candidate[o] * srcA + base[o] * dstA * (1 - srcA)) / outA);
      out[o + 1] = Math.round((candidate[o + 1] * srcA + base[o + 1] * dstA * (1 - srcA)) / outA);
      out[o + 2] = Math.round((candidate[o + 2] * srcA + base[o + 2] * dstA * (1 - srcA)) / outA);
      out[o + 3] = Math.round(outA * 255);
    } else {
      out[o] = candidate[o];
      out[o + 1] = candidate[o + 1];
      out[o + 2] = candidate[o + 2];
      out[o + 3] = ca;
    }
  }
  return out;
}

export async function finalizeHead(sourcePath, destPath, referencePath = REF) {
  const ref = await loadRaw(referencePath);
  if (ref.w !== SIZE || ref.h !== SIZE) throw new Error(`Reference must be ${SIZE}x${SIZE}`);

  let { data, w, h } = await loadRaw(sourcePath);
  data = keyOutBackground(data, w, h);
  data = await resizeTo1254(data, w, h);

  const mask = buildOverlayMask(ref.data, data, SIZE, SIZE);
  const final = compositeOntoBase(ref.data, data, mask);

  mkdirSync(dirname(destPath), { recursive: true });
  await sharp(final, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toFile(destPath);
  return destPath;
}

async function main() {
  const { source, dest, reference } = parseArgs();
  if (!source || !dest) {
    console.error("Usage: finalize_head_builtin.mjs --source <ai.png> --dest <final.png>");
    process.exit(1);
  }
  const out = await finalizeHead(source, dest, reference);
  console.log(out);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
