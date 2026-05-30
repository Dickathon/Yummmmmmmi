#!/usr/bin/env node
/**
 * Move finalized dress PNGs into component subfolders under pictures/.
 * Skips _tmp_* directories and 标准底图.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PICTURES_DIR = path.resolve(__dirname, "../装扮/pictures");

const SUFFIX_TO_FOLDER = {
  "_躯干.png": "躯干",
  "_头部.png": "头部",
  "_四肢.png": "四肢",
  "_尾巴.png": "尾巴",
  "_毯子.png": "毯子",
};

const SKIP_DIRS = new Set(["标准底图"]);

function isTmpDir(name) {
  return name.startsWith("_tmp");
}

function targetFolder(filename) {
  for (const [suffix, folder] of Object.entries(SUFFIX_TO_FOLDER)) {
    if (filename.endsWith(suffix)) return folder;
  }
  return null;
}

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (isTmpDir(entry.name) || SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), results);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function organize({ dryRun = false } = {}) {
  const moves = [];

  for (const filePath of walk(PICTURES_DIR)) {
    const filename = path.basename(filePath);
    const folder = targetFolder(filename);
    if (!folder) continue;

    const parent = path.basename(path.dirname(filePath));
    if (parent === folder) continue;

    const dest = path.join(PICTURES_DIR, folder, filename);
    if (fs.existsSync(dest) && path.resolve(dest) !== path.resolve(filePath)) {
      console.warn(`SKIP (exists): ${filename} already in ${folder}/`);
      continue;
    }

    moves.push({ from: filePath, to: dest });
  }

  for (const { from, to } of moves) {
    const relFrom = path.relative(PICTURES_DIR, from);
    const relTo = path.relative(PICTURES_DIR, to);
    if (dryRun) {
      console.log(`DRY  ${relFrom} -> ${relTo}`);
    } else {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.renameSync(from, to);
      console.log(`MOVE ${relFrom} -> ${relTo}`);
    }
  }

  if (!moves.length) console.log("All finalized PNGs already in component folders.");
  return moves.length;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  organize({ dryRun });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}

export { organize, SUFFIX_TO_FOLDER, PICTURES_DIR };
