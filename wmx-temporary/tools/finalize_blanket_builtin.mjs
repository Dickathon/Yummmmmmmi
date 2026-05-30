#!/usr/bin/env node
/**
 * Finalize AI-generated blanket: extract content, scale to reference ellipse bbox, clamp, validate.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { PNG } from "pngjs";
import { validateBlanket } from "./validate_blanket_anchor.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CANVAS = 1254;
const DEFAULT_REFERENCE = path.join(ROOT, "装扮/latest-pictures/标准底图/blanket_1254.png");
const DEFAULT_ANCHOR = path.join(ROOT, "装扮/latest-pictures/标准底图/blanket_anchor.json");
const ALPHA_THRESHOLD = 12;
const DEFAULT_OUTWARD_ALLOWANCE = 14;
const BLACK_THRESHOLD = 36;

function parseArgs(argv) {
  const args = {
    source: null,
    out: null,
    reference: DEFAULT_REFERENCE,
    anchor: DEFAULT_ANCHOR,
    outward: DEFAULT_OUTWARD_ALLOWANCE,
  };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--source") args.source = path.resolve(argv[++i]);
    else if (argv[i] === "--out") args.out = path.resolve(argv[++i]);
    else if (argv[i] === "--reference") args.reference = path.resolve(argv[++i]);
    else if (argv[i] === "--anchor") args.anchor = path.resolve(argv[++i]);
    else if (argv[i] === "--outward") args.outward = Number(argv[++i]);
  }
  return args;
}

function loadAnchor(anchorPath) {
  const data = JSON.parse(fs.readFileSync(anchorPath, "utf8"));
  return {
    bbox: data.bbox,
    centerX: data.ellipse.centerX,
    centerY: data.ellipse.centerY,
    semiA: data.ellipse.semiA,
    semiB: data.ellipse.semiB,
  };
}

async function loadRgbaBuffer(filePath) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: Buffer.from(data), width: info.width, height: info.height, channels: info.channels };
}

function keyOutBackground(data, width, height, channels) {
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const si = i * channels;
    const r = data[si];
    const g = data[si + 1];
    const b = data[si + 2];
    const a = channels >= 4 ? data[si + 3] : 255;
    const di = i * 4;
    const dark = r + g + b < BLACK_THRESHOLD;
    const alpha = dark ? 0 : (a > 8 ? a : 255);
    out[di] = r;
    out[di + 1] = g;
    out[di + 2] = b;
    out[di + 3] = alpha;
  }
  return out;
}

function contentBbox(rgba, width, height) {
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = rgba[(y * width + x) * 4 + 3];
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

function cropRgba(rgba, width, height, bbox) {
  const [x0, y0, x1, y1] = bbox;
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = ((y0 + y) * width + (x0 + x)) * 4;
      const di = (y * cw + x) * 4;
      out[di] = rgba[si];
      out[di + 1] = rgba[si + 1];
      out[di + 2] = rgba[si + 2];
      out[di + 3] = rgba[si + 3];
    }
  }
  return { data: out, width: cw, height: ch };
}

async function resizeRgba(src, targetW, targetH) {
  const png = new PNG({ width: src.width, height: src.height });
  src.data.copy(png.data);
  const input = PNG.sync.write(png);
  const buf = await sharp(input).resize(targetW, targetH, { fit: "fill" }).png().toBuffer();
  return PNG.sync.read(buf).data;
}

function expandAlphaAndColor(rgba, width, height, radius) {
  if (radius <= 0) return rgba;
  const source = Buffer.from(rgba);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (source[i * 4 + 3] <= ALPHA_THRESHOLD) continue;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = (ny * width + nx) * 4;
          if (rgba[ni + 3] > ALPHA_THRESHOLD) continue;
          rgba[ni] = source[i * 4];
          rgba[ni + 1] = source[i * 4 + 1];
          rgba[ni + 2] = source[i * 4 + 2];
          rgba[ni + 3] = 255;
        }
      }
    }
  }
  return rgba;
}

function dilateMask(mask, width, height, radius) {
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

async function compositeToCanvas(contentData, contentW, contentH, anchor, referencePath, outwardAllowance) {
  const [tx0, ty0, tx1, ty1] = anchor.bbox;
  const targetW = tx1 - tx0 + 1;
  const targetH = ty1 - ty0 + 1;

  const scaled = await resizeRgba({ data: contentData, width: contentW, height: contentH }, targetW, targetH);
  const canvas = new PNG({ width: CANVAS, height: CANVAS, fill: false });

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const si = (y * targetW + x) * 4;
      const alpha = scaled[si + 3];
      if (alpha <= ALPHA_THRESHOLD) continue;
      const dx = tx0 + x;
      const dy = ty0 + y;
      if (dx < 0 || dy < 0 || dx >= CANVAS || dy >= CANVAS) continue;
      const di = (dy * CANVAS + dx) * 4;
      canvas.data[di] = scaled[si];
      canvas.data[di + 1] = scaled[si + 1];
      canvas.data[di + 2] = scaled[si + 2];
      canvas.data[di + 3] = alpha;
    }
  }

  const reference = PNG.sync.read(fs.readFileSync(referencePath));
  const refMask = new Uint8Array(CANVAS * CANVAS);
  for (let i = 0; i < CANVAS * CANVAS; i++) {
    refMask[i] = reference.data[i * 4 + 3] > ALPHA_THRESHOLD ? 1 : 0;
  }
  const allowed = dilateMask(refMask, CANVAS, CANVAS, outwardAllowance);
  for (let i = 0; i < CANVAS * CANVAS; i++) {
    if (!allowed[i]) canvas.data[i * 4 + 3] = 0;
  }

  expandAlphaAndColor(canvas.data, CANVAS, CANVAS, 4);

  return canvas;
}

async function finalizeBlanket(sourcePath, outPath, options = {}) {
  const reference = options.reference ?? DEFAULT_REFERENCE;
  const anchorPath = options.anchor ?? DEFAULT_ANCHOR;
  const outward = options.outward ?? DEFAULT_OUTWARD_ALLOWANCE;
  const anchor = loadAnchor(anchorPath);

  const loaded = await loadRgbaBuffer(sourcePath);
  const keyed = keyOutBackground(loaded.data, loaded.width, loaded.height, loaded.channels);
  const bbox = contentBbox(keyed, loaded.width, loaded.height);
  if (!bbox) throw new Error(`No visible content in ${sourcePath}`);

  const cropped = cropRgba(keyed, loaded.width, loaded.height, bbox);
  const canvas = await compositeToCanvas(cropped.data, cropped.width, cropped.height, anchor, reference, outward);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, PNG.sync.write(canvas));
  return validateBlanket(outPath, { reference });
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.source || !args.out) {
    console.error("Usage: finalize_blanket_builtin.mjs --source <ai.png> --out <final.png>");
    process.exit(1);
  }

  const report = await finalizeBlanket(args.source, args.out, {
    reference: args.reference,
    anchor: args.anchor,
    outward: args.outward,
  });

  console.log(report.passed ? "PASS" : "FAIL", path.basename(args.out));
  if (!report.passed) {
    for (const reason of report.reasons) console.error("reason:", reason);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { finalizeBlanket };
