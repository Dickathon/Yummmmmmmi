(function (global) {
  "use strict";

  var root = global.Yummi.modules.dress;

  function createDiscs() {
    return [
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
