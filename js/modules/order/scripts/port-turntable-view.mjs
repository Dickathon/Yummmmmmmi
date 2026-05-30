import fs from "fs";

const html = fs.readFileSync("wmx-temporary/转盘/index.html", "utf8");
const marker = '<script src="placards.js"></script>';
const startIdx = html.indexOf(marker);
if (startIdx < 0) throw new Error("placards marker not found");

const scriptStart = html.indexOf("<script>", startIdx + marker.length);
const scriptEnd = html.indexOf("</script>", scriptStart);
let inner = html.slice(scriptStart + 8, scriptEnd);

inner = inner.replace(/^\s*\(function \(\) \{\s*"use strict";\s*/, "");
inner = inner.replace(/\s*\}\)\(\);\s*$/, "");

inner = inner.replace(/\s*var INITIAL_CONFIG = [\s\S]*?var state = createInitialState\(\);\s*/, "\n");
inner = inner.replace(/\s*var refs = \{[\s\S]*?rafId: 0\s*\};\s*/, "\n");
inner = inner.replace(/\s*function bindEvents\(\) \{[\s\S]*?\}\s*/g, "\n");
inner = inner.replace(/\s*TurntablePlacards\.applyFoodToDiscs[\s\S]*?refs\.rafId = window\.requestAnimationFrame\(tick\);\s*\}\s*/g, "\n");

inner = inner.replace(/\brefs\./g, "runtime.");
inner = inner.replace(/runtime\.turntableRoot/g, "runtime.stage");

inner = inner.replace(
  /function tick\(timestamp\) \{/,
  "function tick(timestamp) {\n    if (!runtime || !runtime.running) return;"
);

inner = inner.replace(
  /refs\.status/g,
  "runtime.status"
);

inner = inner.replace(/\bstate\./g, "runtime.state.");
inner = inner.replace(
  /function getDiscGeometry\(disc\) \{\s*var g = runtime\.state\.global;/,
  "function getDiscGeometry(disc) {\n    if (!runtime || !runtime.state) return null;\n    var g = runtime.state.global;"
);

inner = inner.replace(
  /href="assets\/cats\/top-texture-cat\.jpg"/g,
  'href="\' + getCapTopTexture() + \'"'
);
inner = inner.replace(
  /CAP_SIDE_IMAGES\[i % CAP_SIDE_IMAGES\.length\]/g,
  "getCapSideImages()[i % getCapSideImages().length]"
);

const header = `(function (global) {
  "use strict";

  var util = global.Yummi.util;
  var root = global.Yummi.modules.order;
  var runtime = null;

  function getCapAssetBase() {
    var tb = root.config && root.config.turntable;
    return (tb && tb.capAssetsBase) || "wmx-temporary/转盘/assets/cats/";
  }

  function getCapSideImages() {
    var base = getCapAssetBase();
    return [
      base + "IMG_20260530_125819.jpg",
      base + "IMG_20260530_125904.jpg",
      base + "IMG_20260530_125935.jpg",
      base + "IMG_20260530_125618.jpg",
      base + "IMG_20260530_125748.jpg",
      base + "IMG_20260530_125756.jpg",
      base + "IMG_20260530_125605.jpg",
      base + "IMG_20260530_125740.jpg"
    ];
  }

  function getCapTopTexture() {
    return getCapAssetBase() + "top-texture-cat.jpg";
  }

  var STATUS_IDLE = "正在自动转动，拖动任意可见盘面即可单独接管。底盘 / 中盘 / 顶盘各 6 格食物立牌，θ=275° 换菜。";

`;

const footer = `
  function render(state) {
    return (
      '<div class="order-root">' +
        '<section class="turntable-root" data-order-stage>' +
          '<svg class="turntable" data-order-svg viewBox="0 0 380 398" preserveAspectRatio="xMidYMid meet" role="img" aria-label="椭圆转盘"></svg>' +
          '<p class="order-status" data-order-status>' + STATUS_IDLE + '</p>' +
        '</section>' +
      '</div>'
    );
  }

  function startAnimation() {
    if (!runtime || runtime.running) return;
    runtime.running = true;
    runtime.state.lastTick = 0;
    runtime.rafId = window.requestAnimationFrame(tick);
  }

  function stopAnimation() {
    if (!runtime) return;
    runtime.running = false;
    runtime.state.lastTick = 0;
    if (runtime.rafId) {
      window.cancelAnimationFrame(runtime.rafId);
      runtime.rafId = 0;
    }
  }

  function bind(container, ctx, state) {
    var stage = container.querySelector("[data-order-stage]");
    var svg = container.querySelector("[data-order-svg]");
    var status = container.querySelector("[data-order-status]");
    var unbinds = [];

    runtime = {
      container: container,
      ctx: ctx,
      state: state,
      stage: stage,
      svg: svg,
      status: status,
      rotors: {},
      sideColorGroups: {},
      sideRotors: {},
      hitTarget: null,
      running: false,
      rafId: 0,
      unbinds: unbinds
    };

    global.TurntablePlacards.attach({
      getDiscGeometry: getDiscGeometry,
      formatNumber: formatNumber,
      normalizeAngle: normalizeAngle
    });
    global.TurntablePlacards.applyFoodToDiscs(state.discs);

    renderTurntable();
    updateStatus();

    unbinds.push(util.on(stage, "pointerdown", handlePointerDown));
    unbinds.push(util.on(stage, "pointermove", handlePointerMove));
    unbinds.push(util.on(stage, "pointerup", handlePointerUp));
    unbinds.push(util.on(stage, "pointercancel", handlePointerUp));
    unbinds.push(util.on(stage, "lostpointercapture", handlePointerUp));

    startAnimation();
  }

  function unbind() {
    if (!runtime) return;
    stopAnimation();
    runtime.unbinds.forEach(function (off) {
      if (typeof off === "function") off();
    });
    global.TurntablePlacards.reset();
    runtime = null;
  }

  root.view = {
    render: render,
    bind: bind,
    unbind: unbind,
    pause: stopAnimation,
    resume: startAnimation
  };
})(typeof window !== "undefined" ? window : this);
`;

const out = header + inner + footer;
fs.writeFileSync("js/modules/order/view.js", out);
console.log("view.js bytes:", out.length);
