#!/usr/bin/env node
/** Classify generated dress-up PNGs into component subfolders and _tmp_*_builtin archives. */
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..", "装扮", "pictures");
const ASSETS = resolve(
  process.env.CURSOR_ASSETS ||
    "C:/Users/26467/.cursor/projects/c-Users-26467-Desktop-projects-Yummi/assets"
);

const COMPONENT_SUFFIX = {
  躯干: "躯干",
  四肢: "四肢",
  头部: "头部",
  尾巴: "尾巴",
  毯子: "毯子",
};

const TMP_BY_SUFFIX = {
  躯干: "_tmp_body_builtin",
  四肢: "_tmp_legs_builtin",
  头部: "_tmp_head_builtin",
  尾巴: "_tmp_tail_builtin",
  毯子: "_tmp_blanket_builtin",
};

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function detectComponent(filename) {
  for (const suffix of Object.keys(COMPONENT_SUFFIX)) {
    if (filename.includes(`_${suffix}`)) return suffix;
  }
  return null;
}

function isRawArchive(filename) {
  return /_(raw|ai|v\d+)(\.png)$/i.test(filename) || filename.includes("_raw.");
}

function moveIfExists(src, dest) {
  if (!existsSync(src)) return false;
  ensureDir(join(dest, ".."));
  if (existsSync(dest)) {
    unlinkSync(src);
    console.log(`REMOVE duplicate root: ${basename(src)} (already in ${basename(join(dest, ".."))})`);
    return false;
  }
  renameSync(src, dest);
  console.log(`MOVE ${basename(src)} -> ${dest.replace(ROOT + "/", "").replace(ROOT + "\\", "")}`);
  return true;
}

function copyIfNewerOrMissing(src, dest) {
  if (!existsSync(src)) return false;
  ensureDir(join(dest, ".."));
  if (existsSync(dest)) {
    const srcM = statSync(src).mtimeMs;
    const destM = statSync(dest).mtimeMs;
    if (srcM <= destM) {
      console.log(`SKIP up-to-date: ${basename(dest)}`);
      return false;
    }
  }
  copyFileSync(src, dest);
  console.log(`COPY ${basename(src)} -> ${dest.replace(ROOT + "/", "").replace(ROOT + "\\", "")}`);
  return true;
}

function organizeRootPictures() {
  for (const name of readdirSync(ROOT)) {
    if (!name.endsWith(".png")) continue;
    const component = detectComponent(name);
    if (!component) continue;
    const src = join(ROOT, name);
    if (!statSync(src).isFile()) continue;
    const dest = join(ROOT, component, name);
    moveIfExists(src, dest);
  }
}

function ingestAssets() {
  if (!existsSync(ASSETS)) {
    console.warn(`Assets dir not found: ${ASSETS}`);
    return;
  }

  for (const name of readdirSync(ASSETS)) {
    if (!name.endsWith(".png")) continue;
    const component = detectComponent(name);
    if (!component) continue;

    const src = join(ASSETS, name);
    const tmpDir = join(ROOT, TMP_BY_SUFFIX[component]);
    ensureDir(tmpDir);

    // Only archive intermediates in Cursor assets; finals are normalized in-repo.
    if (isRawArchive(name) || name.includes("_ai.")) {
      copyIfNewerOrMissing(src, join(tmpDir, name));
    }
  }
}

function main() {
  for (const component of Object.keys(COMPONENT_SUFFIX)) {
    ensureDir(join(ROOT, component));
    ensureDir(join(ROOT, TMP_BY_SUFFIX[component]));
  }
  ensureDir(join(ROOT, "标准底图"));

  console.log("=== Organize root pictures into component folders ===");
  organizeRootPictures();

  console.log("\n=== Ingest Cursor assets ===");
  ingestAssets();

  console.log("\n=== Summary ===");
  for (const component of Object.keys(COMPONENT_SUFFIX)) {
    const dir = join(ROOT, component);
    const count = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".png")).length : 0;
    const tmp = join(ROOT, TMP_BY_SUFFIX[component]);
    const tmpCount = existsSync(tmp) ? readdirSync(tmp).filter((f) => f.endsWith(".png")).length : 0;
    console.log(`${component}: ${count} final, ${tmpCount} archived`);
  }
}

main();
