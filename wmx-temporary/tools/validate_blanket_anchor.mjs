#!/usr/bin/env node
/**
 * Validate blanket PNG against blanket_1254.png reference anchor.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const STANDARD_DIR = path.join(ROOT, "装扮/latest-pictures/标准底图");
const DEFAULT_REFERENCE = path.join(STANDARD_DIR, "blanket_1254.png");
const ALPHA_THRESHOLD = 12;
const DEFAULT_MAX_SHIFT = 3;
const DEFAULT_MAX_MISSING_RATIO = 0.02;

function loadPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function alphaAt(png, x, y) {
  return png.data[(png.width * y + x) * 4 + 3];
}

function binaryMask(png) {
  const mask = new Uint8Array(png.width * png.height);
  for (let i = 0; i < mask.length; i++) {
    mask[i] = png.data[i * 4 + 3] > ALPHA_THRESHOLD ? 1 : 0;
  }
  return mask;
}

function maskBbox(mask, width, height) {
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x]) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return minX <= maxX ? [minX, minY, maxX, maxY] : null;
}

function inwardShift(ref, cand) {
  return {
    left: Math.max(0, cand[0] - ref[0]),
    top: Math.max(0, cand[1] - ref[1]),
    right: Math.max(0, ref[2] - cand[2]),
    bottom: Math.max(0, ref[3] - cand[3]),
  };
}

function dilateMask(mask, width, height, radius) {
  if (radius <= 0) return mask.slice();
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let on = 0;
      for (let dy = -radius; dy <= radius && !on; dy++) {
        for (let dx = -radius; dx <= radius && !on; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < width && ny < height && mask[ny * width + nx]) on = 1;
        }
      }
      out[y * width + x] = on;
    }
  }
  return out;
}

function missingRatio(refMask, candMask, width, height, radius) {
  const dilated = dilateMask(candMask, width, height, radius);
  let refCount = 0;
  let missing = 0;
  for (let i = 0; i < refMask.length; i++) {
    if (refMask[i]) {
      refCount++;
      if (!dilated[i]) missing++;
    }
  }
  return refCount ? missing / refCount : 1;
}

function cornerAlphas(png) {
  const w = png.width;
  const h = png.height;
  return {
    top_left: alphaAt(png, 0, 0),
    top_right: alphaAt(png, w - 1, 0),
    bottom_left: alphaAt(png, 0, h - 1),
    bottom_right: alphaAt(png, w - 1, h - 1),
  };
}

export function validateBlanket(candidatePath, options = {}) {
  const referencePath = options.reference ?? DEFAULT_REFERENCE;
  const maxShift = options.maxShift ?? DEFAULT_MAX_SHIFT;
  const maxMissingRatio = options.maxMissingRatio ?? DEFAULT_MAX_MISSING_RATIO;

  const reference = loadPng(referencePath);
  const candidate = loadPng(candidatePath);
  const reasons = [];

  if (reference.width !== candidate.width || reference.height !== candidate.height) {
    reasons.push("Reference and candidate must share canvas size.");
  }

  const corners = cornerAlphas(candidate);
  for (const [label, alpha] of Object.entries(corners)) {
    if (alpha !== 0) reasons.push(`Corner alpha must be 0 at ${label}, got ${alpha}.`);
  }

  const refMask = binaryMask(reference);
  const candMask = binaryMask(candidate);
  const refBbox = maskBbox(refMask, reference.width, reference.height);
  const candBbox = maskBbox(candMask, candidate.width, candidate.height);

  if (!refBbox) reasons.push("Reference alpha mask is empty.");
  if (!candBbox) reasons.push("Candidate alpha mask is empty.");

  let shift = null;
  let maxInward = 0;
  let missRatio = 1;

  if (refBbox && candBbox) {
    shift = inwardShift(refBbox, candBbox);
    maxInward = Math.max(...Object.values(shift));
    if (maxInward > maxShift) {
      reasons.push(`Inward bbox shift ${maxInward}px exceeds allowed ${maxShift}px.`);
    }
    missRatio = missingRatio(refMask, candMask, reference.width, reference.height, maxShift);
    if (missRatio > maxMissingRatio) {
      reasons.push(`Missing reference coverage ${(missRatio * 100).toFixed(2)}% exceeds ${(maxMissingRatio * 100).toFixed(2)}%.`);
    }
  }

  const report = {
    component: "blanket",
    reference: referencePath,
    candidate: candidatePath,
    reference_bbox: refBbox,
    candidate_bbox: candBbox,
    inward_shift: shift,
    max_inward_shift: maxInward,
    missing_ratio: missRatio,
    candidate_corner_alpha: corners,
    passed: reasons.length === 0,
    reasons,
  };

  return report;
}

function formatSummary(report) {
  const name = path.basename(String(report.candidate));
  const status = report.passed ? "PASS" : "FAIL";
  const lines = [
    `${status} blanket ${name}`,
    `bbox: ref=${JSON.stringify(report.reference_bbox)} cand=${JSON.stringify(report.candidate_bbox)}`,
    `max_inward_shift=${report.max_inward_shift} missing_ratio=${report.missing_ratio}`,
  ];
  for (const reason of report.reasons) lines.push(`reason: ${reason}`);
  return lines.join("\n");
}

function parseArgs(argv) {
  const args = { candidates: [], reference: DEFAULT_REFERENCE, report: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--reference") args.reference = path.resolve(argv[++i]);
    else if (argv[i] === "--report") args.report = path.resolve(argv[++i]);
    else if (argv[i] === "--candidate") args.candidates.push(path.resolve(argv[++i]));
    else if (!argv[i].startsWith("-")) args.candidates.push(path.resolve(argv[i]));
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.candidates.length) {
    console.error("Usage: validate_blanket_anchor.mjs --candidate <path> [--reference <path>]");
    process.exit(1);
  }

  const reports = args.candidates.map((c) => validateBlanket(c, { reference: args.reference }));
  const allPassed = reports.every((r) => r.passed);

  if (args.report) {
    fs.writeFileSync(args.report, JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 2));
  }

  for (const report of reports) console.log(formatSummary(report));
  process.exit(allPassed ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
