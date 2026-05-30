import fs from "fs";
import vm from "vm";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sandbox = { Yummi: {}, Buffer: globalThis.Buffer };
const wrap = (file) => {
  const code = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInNewContext(code, sandbox);
};
wrap("foods.js");
wrap("food-taste-db.js");
wrap("food-taste.js");
wrap("food-selection-codec.js");

const foods = sandbox.Yummi.foods.getAll();
const missing = sandbox.Yummi.foodTaste.assertCoverage();
if (missing.length) {
  console.error("Missing taste records:", missing);
  process.exit(1);
}
console.log("OK:", foods.length, "foods,", Object.keys(sandbox.Yummi.foodTasteDb.records).length, "taste records");
const agg = sandbox.Yummi.foodTaste.profileFromSelection(["麻婆豆腐", "珍珠奶茶", "薄荷柠檬水"]);
console.log("Sample aggregate profile:", agg.profile, "count", agg.count);
console.log("Sample match 麻婆豆腐 vs neutral:", sandbox.Yummi.foodTaste.matchScore(sandbox.Yummi.foodTaste.createNeutralProfile(), "麻婆豆腐"));

const enc = sandbox.Yummi.foodSelectionCodec.encode(["麻婆豆腐", "珍珠奶茶", "薄荷柠檬水"]);
if (!enc.ok) throw new Error("encode failed");
const dec = sandbox.Yummi.foodSelectionCodec.decode(enc.code);
const expectSet = new Set(["麻婆豆腐", "珍珠奶茶", "薄荷柠檬水"]);
if (!dec.ok || dec.names.length !== expectSet.size || !dec.names.every((n) => expectSet.has(n))) {
  throw new Error("codec roundtrip failed: " + JSON.stringify(dec));
}
console.log("Codec export sample (opaque):", enc.code);

const cmp = sandbox.Yummi.foodSelectionCodec.compareImport(
  ["麻婆豆腐", "酸辣粉"],
  enc.code
);
if (!cmp.ok || cmp.similarity < 0 || cmp.similarity > 100) {
  throw new Error("compareImport failed: " + JSON.stringify(cmp));
}
console.log("Compare import:", cmp);
