#!/usr/bin/env node
/** Quick batch validator for 1254 torso outputs (size + corner alpha + bbox shift). */
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";

const ROOT = resolve(import.meta.dirname, "..");
const PICTURES = join(ROOT, "装扮", "pictures", "躯干");
const REF = join(ROOT, "装扮", "pictures", "标准底图", "body_1254.png");
const EXPECTED = [
  "小鸡炖蘑菇-躯干.png",
  "红烧肉-躯干.png",
  "烧鹅-躯干.png",
  "火锅-躯干.png",
  "羊肉泡馍-躯干.png",
  "大盘鸡-躯干.png",
  "牛排-躯干.png",
  "蔬菜沙拉-躯干.png",
  "石锅拌饭-躯干.png",
  "冬阴功汤-躯干.png",
  "咖喱饭-躯干.png",
];

const ALPHA_THRESHOLD = 12;
const MAX_INWARD_SHIFT = 3;

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
  let minX = w, minY = h, maxX = -1, maxY = -1;
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

async function validateOne(refMeta, candidatePath) {
  const name = candidatePath.split(/[/\\]/).pop();
  const reasons = [];
  const { data, w, h } = await loadRgba(candidatePath);

  if (w !== 1254 || h !== 1254) reasons.push(`size ${w}x${h}`);

  const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
  for (const [x, y] of corners) {
    const a = data[(y * w + x) * 4 + 3];
    if (a !== 0) reasons.push(`corner (${x},${y}) alpha=${a}`);
  }

  const refMask = binaryMask(refMeta.data, refMeta.w, refMeta.h, ALPHA_THRESHOLD);
  const candMask = binaryMask(data, w, h, ALPHA_THRESHOLD);
  const refBox = bbox(refMask, refMeta.w, refMeta.h);
  const candBox = bbox(candMask, w, h);
  if (!refBox || !candBox) reasons.push("empty alpha mask");

  let maxInward = 0;
  if (refBox && candBox) {
    const shift = inwardShift(refBox, candBox);
    maxInward = Math.max(shift.left, shift.top, shift.right, shift.bottom);
    if (maxInward > MAX_INWARD_SHIFT) reasons.push(`inward shift ${maxInward}px`);
  }

  return { name, passed: reasons.length === 0, reasons, maxInward, refBox, candBox };
}

async function main() {
  const refMeta = await loadRgba(REF);
  const missing = EXPECTED.filter((f) => !readdirSync(PICTURES).includes(f));
  if (missing.length) {
    console.error("MISSING:", missing.join(", "));
    process.exit(1);
  }

  let fail = 0;
  for (const file of EXPECTED) {
    const result = await validateOne(refMeta, join(PICTURES, file));
    const status = result.passed ? "PASS" : "FAIL";
    console.log(`${status} ${result.name} max_inward=${result.maxInward ?? "n/a"}`);
    if (!result.passed) {
      fail += 1;
      result.reasons.forEach((r) => console.log(`  reason: ${r}`));
    }
  }
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
