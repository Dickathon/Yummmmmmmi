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
wrap("food-selection.js");

const foods = sandbox.Yummi.foods.getAll();
const missing = sandbox.Yummi.foodTaste.assertCoverage();
if (missing.length) {
  console.error("Missing taste records:", missing);
  process.exit(1);
}
console.log("OK:", foods.length, "foods,", Object.keys(sandbox.Yummi.foodTasteDb.records).length, "taste records");
const agg = sandbox.Yummi.foodTaste.profileFromSelection(["九转大肠", "珍珠奶茶", "美式咖啡"]);
console.log("Sample aggregate profile:", agg.profile, "count", agg.count);
console.log("Sample match 九转大肠 vs neutral:", sandbox.Yummi.foodTaste.matchScore(sandbox.Yummi.foodTaste.createNeutralProfile(), "九转大肠"));

const enc = sandbox.Yummi.foodSelectionCodec.encode(["九转大肠", "珍珠奶茶", "美式咖啡"]);
if (!enc.ok) throw new Error("encode failed");
const dec = sandbox.Yummi.foodSelectionCodec.decode(enc.code);
const expectSet = new Set(["九转大肠", "珍珠奶茶", "美式咖啡"]);
if (!dec.ok || dec.names.length !== expectSet.size || !dec.names.every((n) => expectSet.has(n))) {
  throw new Error("codec roundtrip failed: " + JSON.stringify(dec));
}
console.log("Codec export sample (opaque):", enc.code);

const cmp = sandbox.Yummi.foodSelectionCodec.compareImport(
  ["九转大肠", "酸辣粉"],
  enc.code
);
if (!cmp.ok || cmp.similarity < 0 || cmp.similarity > 100) {
  throw new Error("compareImport failed: " + JSON.stringify(cmp));
}
console.log("Compare import:", cmp);

const sel = sandbox.Yummi.foodSelection;
sel.clear();
let rec = sel.record("九转大肠");
if (!rec.ok || rec.count !== 1) throw new Error("record failed: " + JSON.stringify(rec));
rec = sel.record("九转大肠");
if (!rec.ok || !rec.alreadySelected || rec.count !== 1) {
  throw new Error("record dedupe failed: " + JSON.stringify(rec));
}
rec = sel.toggle("珍珠奶茶");
if (!rec.ok || !rec.selected || rec.count !== 2) {
  throw new Error("toggle add failed: " + JSON.stringify(rec));
}
rec = sel.toggle("九转大肠");
if (!rec.ok || rec.selected !== false || rec.count !== 1) {
  throw new Error("toggle remove failed: " + JSON.stringify(rec));
}
const prof = sel.getProfile();
if (!prof || prof.count !== 1 || prof.used[0] !== "珍珠奶茶") {
  throw new Error("getProfile failed: " + JSON.stringify(prof));
}
const exp = sel.exportCode();
if (!exp.ok) throw new Error("exportCode failed");
const cmpSel = sel.compareWithCode(exp.code);
if (!cmpSel.ok || cmpSel.similarity !== 100) {
  throw new Error("compareWithCode self failed: " + JSON.stringify(cmpSel));
}
sel.clear();
console.log("Food selection API OK");
