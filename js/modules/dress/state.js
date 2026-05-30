(function (global) {
  "use strict";

  var root = global.Yummi.modules.dress;

  function resolveItemUrls(relativePaths) {
    var base = (root.config && root.config.itemsBase) || "";
    return relativePaths.map(function (path) {
      return base + path;
    });
  }

  /** centerAngle 与 view 格心绑定；槽位随盘面公转，牌身始终朝屏幕上方 */
  function createSectorSlots(sectorCount) {
    var step = 360 / sectorCount;
    var slots = [];
    var i;

    for (i = 0; i < sectorCount; i += 1) {
      slots.push({
        index: i,
        centerAngle: i * step + step / 2,
        imageIndex: i
      });
    }

    return slots;
  }

  function applyDiscItems(disc) {
    var cfg = root.config && root.config.discs && root.config.discs[disc.id];
    if (!cfg || !cfg.items || !cfg.items.length) {
      disc.itemUrls = [];
      disc.itemSize = 0;
      disc.placardLift = 0;
      disc.sectorSlots = [];
      return;
    }

    disc.itemSize = cfg.itemSize || 24;
    disc.placardLift = cfg.placardLift || 0;
    disc.itemUrls = resolveItemUrls(cfg.items);
    disc.sectorSlots = createSectorSlots(disc.sectorColors.length);
  }

  function createDiscs() {
    var discs = [
      {
        id: "base",
        label: "底盘",
        cx: 190,
        cy: 286,
        rx: 150,
        ry: 38,
        height: 64,
        angle: 8,
        autoSpeed: 8,
        hitInnerRadius: 116,
        sectorInnerRadius: 36,
        dragging: false,
        pointerId: null,
        lastPointerAngle: null,
        topColor: "#f5f0e8",
        capColor: "#e8dfd1",
        sideGradientId: "dress-base-side",
        sectorColors: ["#f5f0e8", "#f0e7d9", "#e8dfd1", "#f3ebe0", "#c4a882", "#efe3d4"]
      },
      {
        id: "mid",
        label: "中盘",
        cx: 190,
        cy: 212,
        rx: 108,
        ry: 28,
        height: 54,
        angle: 24,
        autoSpeed: 12,
        hitInnerRadius: 78,
        sectorInnerRadius: 28,
        dragging: false,
        pointerId: null,
        lastPointerAngle: null,
        topColor: "#f4e1e1",
        capColor: "#f7eeee",
        sideGradientId: "dress-mid-side",
        sectorColors: ["#f4e1e1", "#f9efef", "#f1d7d7", "#ead1d1", "#e8dfd1", "#f8f3f1"]
      },
      {
        id: "top",
        label: "顶盘",
        cx: 190,
        cy: 148,
        rx: 72,
        ry: 19,
        height: 42,
        angle: 48,
        autoSpeed: 16,
        hitInnerRadius: 0,
        sectorInnerRadius: 20,
        dragging: false,
        pointerId: null,
        lastPointerAngle: null,
        topColor: "#8fbc8f",
        capColor: "#e8dfd1",
        sideGradientId: "dress-top-side",
        sectorColors: ["#8fbc8f", "#a7c7a3", "#dfe9d8", "#c9dbbf", "#9caf88", "#b7d0aa"]
      }
    ];

    discs.forEach(applyDiscItems);
    return discs;
  }

  root.state = {
    create: function () {
      return {
        phase: "idle",
        equipped: [],
        discs: createDiscs(),
        activeDiscId: null,
        activePointerId: null,
        lastTick: 0
      };
    },
    reset: function (state) {
      if (!state) return;
      state.phase = "idle";
      state.equipped = [];
      state.discs = createDiscs();
      state.activeDiscId = null;
      state.activePointerId = null;
      state.lastTick = 0;
    }
  };
})(typeof window !== "undefined" ? window : this);
