import fs from "fs";
import vm from "vm";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sandbox = { Yummi: {} };
const wrap = (file) => {
  const code = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInNewContext(code, sandbox);
};
wrap("foods.js");
wrap("food-taste-db.js");
wrap("food-taste.js");

const foods = sandbox.Yummi.foods.getAll();
const missing = sandbox.Yummi.foodTaste.assertCoverage();
if (missing.length) {
  console.error("Missing taste records:", missing);
  process.exit(1);
}
console.log("OK:", foods.length, "foods,", Object.keys(sandbox.Yummi.foodTasteDb.records).length, "taste records");
console.log("Sample match 麻婆豆腐 vs neutral:", sandbox.Yummi.foodTaste.matchScore(sandbox.Yummi.foodTaste.createNeutralProfile(), "麻婆豆腐"));
