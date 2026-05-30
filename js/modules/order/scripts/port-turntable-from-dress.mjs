/**
 * 一次性：从 dress 复制转盘到 order（类名/数据属性 dress → order）
 * node js/modules/order/scripts/port-turntable-from-dress.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function portText(text, fileHint) {
  var out = text
    .replace(/global\.Yummi\.modules\.dress/g, "global.Yummi.modules.order")
    .replace(/Yummi\.modules\.dress/g, "Yummi.modules.order")
    .replace(/data-dress-/g, "data-order-")
    .replace(/dress-module/g, "order-module")
    .replace(/dress-/g, "order-");

  if (fileHint === "view.js") {
    out = out.replace(
      /<p class="order-stage-card__kicker caption">Ellipse Turntable<\/p>/,
      '<p class="order-stage-card__kicker caption">点餐</p>'
    );
    out = out.replace(
      /<h2 class="order-stage-card__title">三层独立可拖动转盘<\/h2>/,
      '<h2 class="order-stage-card__title">回转式选菜</h2>'
    );
    out = out.replace(
      /<p class="order-stage-card__desc caption">盘体厚度固定不动；扇区随盘旋转，立牌槽位公转，牌身始终朝屏幕上方竖起。<\/p>/,
      '<p class="order-stage-card__desc caption">每格一道菜，拖动盘面选菜，立牌随转盘旋转。</p>'
    );
  }

  if (fileHint === "items-catalog.js") {
    out = out.replace(
      /js\/modules\/dress\/scripts\/gen-items-catalog\.mjs/,
      "js/modules/dress/scripts/gen-items-catalog.mjs"
    );
  }

  return out;
}

const pairs = [
  ["js/modules/dress/view.js", "js/modules/order/view.js", "view.js"],
  ["js/modules/dress/state.js", "js/modules/order/state.js", "state.js"],
  ["js/modules/dress/items-catalog.js", "js/modules/order/items-catalog.js", "items-catalog.js"],
  ["css/modules/dress.css", "css/modules/order.css", "css"],
];

for (const [from, to, hint] of pairs) {
  const src = path.join(root, from);
  const dest = path.join(root, to);
  const text = portText(fs.readFileSync(src, "utf8"), hint);
  fs.writeFileSync(dest, text, "utf8");
  console.log("Wrote", to);
}
