import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");
const base = path.join(repoRoot, "source/compressed/10kb");
const folders = ["food1", "food2", "food3"];
const out = {};

for (const folder of folders) {
  const dir = path.join(base, folder);
  out[folder] = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".webp"))
    .sort()
    .map((name) => `${folder}/${name}`);
}

const body =
  "(function (global) {\n" +
  '  "use strict";\n' +
  "  global.Yummi.modules = global.Yummi.modules || {};\n" +
  "  var root = global.Yummi.modules.dress = global.Yummi.modules.dress || {};\n" +
  "  /** Synced from source/compressed/10kb — run: node js/modules/dress/scripts/gen-items-catalog.mjs */\n" +
  "  root.itemsCatalog = " +
  JSON.stringify(out, null, 2) +
  ";\n" +
  "})(typeof window !== \"undefined\" ? window : this);\n";

const target = path.join(repoRoot, "js/modules/dress/items-catalog.js");
fs.writeFileSync(target, body, "utf8");

console.log(
  "wrote",
  target,
  "—",
  folders.map((f) => `${f}:${out[f].length}`).join(", ")
);
