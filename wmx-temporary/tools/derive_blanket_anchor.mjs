#!/usr/bin/env node
/**
 * Derive oval blanket anchor from legs_1254.png foot positions.
 * Writes blanket_1254.png template + 毯子锚点规范.md + anchor JSON.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEGS_PATH = path.join(ROOT, "装扮/latest-pictures/标准底图/legs_1254.png");
const STANDARD_DIR = path.join(ROOT, "装扮/latest-pictures/标准底图");
const CANVAS = 1254;
const ALPHA_THRESHOLD = 12;

function loadPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function savePng(png, filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

function alphaAt(png, x, y) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return 0;
  return png.data[(png.width * y + x) * 4 + 3];
}

function getLegsBbox(png) {
  let minX = png.width, minY = png.height, maxX = 0, maxY = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      if (alphaAt(png, x, y) > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return [minX, minY, maxX, maxY];
}

function findPawCenters(png, bbox) {
  const [minX, , maxX, maxY] = bbox;
  const bandTop = maxY - Math.floor((bbox[3] - bbox[1]) * 0.32);
  const span = maxX - minX;
  const bandCount = 4;
  const bandWidth = span / bandCount;
  const paws = [];

  for (let i = 0; i < bandCount; i++) {
    const x0 = Math.floor(minX + i * bandWidth);
    const x1 = Math.floor(minX + (i + 1) * bandWidth);
    const pts = [];
    for (let y = bandTop; y <= maxY; y++) {
      for (let x = x0; x <= x1; x++) {
        if (alphaAt(png, x, y) > ALPHA_THRESHOLD) pts.push({ x, y });
      }
    }
    if (pts.length < 12) continue;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const bottomSlice = ys.filter((y) => y >= maxY - Math.floor(span * 0.12));
    const bottomY = bottomSlice.length ? Math.max(...bottomSlice) : Math.max(...ys);
    paws.push({
      centerX: Math.round((Math.min(...xs) + Math.max(...xs)) / 2),
      centerY: Math.round((Math.min(...ys) + Math.max(...ys)) / 2),
      bottomY,
      left: Math.min(...xs),
      right: Math.max(...xs),
    });
  }

  return paws.sort((a, b) => a.centerX - b.centerX);
}

function deriveEllipse(paws) {
  const xs = paws.map((p) => p.centerX);
  const bottoms = paws.map((p) => p.bottomY);
  const left = Math.min(...paws.map((p) => p.left));
  const right = Math.max(...paws.map((p) => p.right));
  const spanX = right - left;
  const centerX = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
  const centerY = Math.round(bottoms.reduce((a, b) => a + b, 0) / bottoms.length - spanX * 0.06);
  const margin = Math.round(spanX * 0.08);
  const semiA = Math.round(spanX / 2 + margin);
  const semiB = Math.round(semiA * 0.56);
  return { centerX, centerY, semiA, semiB, pawSpan: { left, right, spanX } };
}

function ellipseBBox(cx, cy, a, b) {
  return [
    Math.max(0, cx - a),
    Math.max(0, cy - b),
    Math.min(CANVAS - 1, cx + a),
    Math.min(CANVAS - 1, cy + b),
  ];
}

function inEllipse(x, y, cx, cy, a, b) {
  const dx = (x - cx) / a;
  const dy = (y - cy) / b;
  return dx * dx + dy * dy <= 1;
}

function createBlanketTemplate(ellipse, options = {}) {
  const { centerX: cx, centerY: cy, semiA: a, semiB: b } = ellipse;
  const fill = options.fill ?? [245, 240, 232];
  const stroke = options.stroke ?? [196, 168, 130];
  const png = new PNG({ width: CANVAS, height: CANVAS, fill: false });

  for (let y = 0; y < CANVAS; y++) {
    for (let x = 0; x < CANVAS; x++) {
      const i = (CANVAS * y + x) * 4;
      const dist = Math.sqrt(((x - cx) / a) ** 2 + ((y - cy) / b) ** 2);
      if (dist <= 1) {
        const edge = dist > 0.94;
        const c = edge ? stroke : fill;
        png.data[i] = c[0];
        png.data[i + 1] = c[1];
        png.data[i + 2] = c[2];
        png.data[i + 3] = edge ? 255 : 240;
      } else {
        png.data[i + 3] = 0;
      }
    }
  }
  return png;
}

function alphaBbox(png) {
  let minX = CANVAS, minY = CANVAS, maxX = 0, maxY = 0;
  for (let y = 0; y < CANVAS; y++) {
    for (let x = 0; x < CANVAS; x++) {
      if (alphaAt(png, x, y) > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return minX <= maxX ? [minX, minY, maxX, maxY] : null;
}

function writeSpecMarkdown(outPath, data) {
  const md = `# 毯子锚点规范

由 \`derive_blanket_anchor.mjs\` 从 \`legs_1254.png\` 四爪接地点自动推导。

## 画布

- 尺寸：**1254×1254**
- 四角 alpha = 0

## 四爪接地点（推导）

| 爪 | 中心 (x, y) | 接地点 y |
| --- | --- | --- |
${data.paws
  .map(
    (p, i) =>
      `| ${["左前", "右前", "左后", "右后"][i] ?? `爪${i + 1}`} | (${p.centerX}, ${p.centerY}) | ${p.bottomY} |`
  )
  .join("\n")}

## 统一椭圆（所有甜品毯子共用）

| 参数 | 值 |
| --- | --- |
| 椭圆中心 | **(${data.ellipse.centerX}, ${data.ellipse.centerY})** |
| 半长轴 a（水平） | **${data.ellipse.semiA} px** |
| 半短轴 b（垂直） | **${data.ellipse.semiB} px** |
| 外接宽 × 高 | **${data.ellipse.semiA * 2} × ${data.ellipse.semiB * 2} px** |
| alpha bbox | **[${data.bbox.join(", ")}]** |

## 叠放顺序

\`blanket\`（最底）→ \`tail\` → \`body\` → \`legs\` → \`head\`

## 标准底图

- \`blanket_1254.png\`：中性奶油色椭圆，仅作生图定位参考
- 生图时**只编辑椭圆内区域**，禁止绘制猫部件
- 输出命名：\`{食品名}-毯子.png\`
`;
  fs.writeFileSync(outPath, md, "utf8");
}

function main() {
  const legs = loadPng(LEGS_PATH);
  const legsBbox = getLegsBbox(legs);
  const paws = findPawCenters(legs, legsBbox);
  const ellipse = deriveEllipse(paws);
  const bbox = ellipseBBox(ellipse.centerX, ellipse.centerY, ellipse.semiA, ellipse.semiB);

  const template = createBlanketTemplate(ellipse);
  const templatePath = path.join(STANDARD_DIR, "blanket_1254.png");
  savePng(template, templatePath);

  const anchorData = {
    source: LEGS_PATH,
    legs_bbox: legsBbox,
    paws,
    ellipse,
    bbox,
    template_bbox: alphaBbox(template),
    canvas: CANVAS,
  };

  const jsonPath = path.join(STANDARD_DIR, "blanket_anchor.json");
  fs.writeFileSync(jsonPath, JSON.stringify(anchorData, null, 2), "utf8");

  const specPath = path.join(STANDARD_DIR, "毯子锚点规范.md");
  writeSpecMarkdown(specPath, anchorData);

  console.log(JSON.stringify(anchorData, null, 2));
  console.log(`\nWrote ${templatePath}`);
  console.log(`Wrote ${specPath}`);
  console.log(`Wrote ${jsonPath}`);
}

main();

export { inEllipse, createBlanketTemplate, ellipseBBox, CANVAS, ALPHA_THRESHOLD, alphaAt };
