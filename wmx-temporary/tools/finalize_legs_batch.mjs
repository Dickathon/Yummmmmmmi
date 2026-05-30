#!/usr/bin/env node
/** Batch finalize legs: normalize raw AI outputs to 1254x1254 and validate anchor. */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PICTURES = join(ROOT, "装扮", "pictures");
const TMP = join(PICTURES, "_tmp_legs_builtin");
const OUT_DIR = join(PICTURES, "四肢");
const REF = join(PICTURES, "标准底图", "legs_1254.png");
const NORMALIZE = join(__dirname, "normalize_legs_builtin.mjs");

const EXPECTED = [
  "春卷",
  "肠粉",
  "小炒黄牛肉",
  "麻辣小龙虾",
  "手抓羊肉",
  "薯条",
  "炸鸡",
  "糖醋排骨",
  "锅包肉",
  "海蛎煎",
];

const ASSETS =
  process.env.CURSOR_ASSETS ||
  "C:/Users/26467/.cursor/projects/c-Users-26467-Desktop-projects-Yummi/assets";

const ALPHA_THRESHOLD = 12;
const MAX_INWARD_SHIFT = 3;

function binaryMask(data, w, h) {
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      mask[y * w + x] = data[(y * w + x) * 4 + 3] > ALPHA_THRESHOLD ? 255 : 0;
    }
  }
  return mask;
}

function bbox(mask, w, h) {
  let minX = w,
    minY = h,
    maxX = -1,
    maxY = -1;
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

function inwardShift(ref, cand) {
  return {
    left: Math.max(0, cand[0] - ref[0]),
    top: Math.max(0, cand[1] - ref[1]),
    right: Math.max(0, ref[2] - cand[2]),
    bottom: Math.max(0, ref[3] - cand[3]),
  };
}

async function loadRgba(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

async function validate(refMeta, candidatePath) {
  const reasons = [];
  const { data, w, h } = await loadRgba(candidatePath);
  if (w !== 1254 || h !== 1254) reasons.push(`size ${w}x${h}`);
  for (const [x, y] of [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ]) {
    if (data[(y * w + x) * 4 + 3] !== 0) reasons.push(`corner (${x},${y}) not transparent`);
  }
  const refMask = binaryMask(refMeta.data, refMeta.w, refMeta.h);
  const candMask = binaryMask(data, w, h);
  const refBox = bbox(refMask, refMeta.w, refMeta.h);
  const candBox = bbox(candMask, w, h);
  if (!refBox || !candBox) reasons.push("empty alpha mask");
  let maxInward = 0;
  if (refBox && candBox) {
    const shift = inwardShift(refBox, candBox);
    maxInward = Math.max(shift.left, shift.top, shift.right, shift.bottom);
    if (maxInward > MAX_INWARD_SHIFT) reasons.push(`inward shift ${maxInward}px`);
  }
  return { passed: reasons.length === 0, reasons, maxInward };
}

function findRaw(food) {
  const name = `${food}_四肢_raw.png`;
  const tmpPath = join(TMP, name);
  if (existsSync(tmpPath)) return tmpPath;
  const assetPath = join(ASSETS, name);
  if (existsSync(assetPath)) {
    mkdirSync(TMP, { recursive: true });
    copyFileSync(assetPath, tmpPath);
    return tmpPath;
  }
  return null;
}

async function main() {
  mkdirSync(TMP, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });
  const refMeta = await loadRgba(REF);
  let fail = 0;

  for (const food of EXPECTED) {
    const raw = findRaw(food);
    const out = join(OUT_DIR, `${food}-四肢.png`);
    if (!raw) {
      console.log(`FAIL ${food}-四肢.png  missing raw`);
      fail += 1;
      continue;
    }

    const result = spawnSync(process.execPath, [NORMALIZE, "--source", raw, "--dest", out], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      console.log(`FAIL ${food}-四肢.png  normalize error`);
      if (result.stderr) console.log(result.stderr.trim());
      fail += 1;
      continue;
    }

    const check = await validate(refMeta, out);
    const status = check.passed ? "PASS" : "FAIL";
    console.log(`${status} ${food}-四肢.png  max_inward=${check.maxInward ?? "n/a"}`);
    if (!check.passed) {
      check.reasons.forEach((r) => console.log(`  reason: ${r}`));
      fail += 1;
    }
  }

  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
