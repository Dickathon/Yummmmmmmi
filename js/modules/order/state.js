/**
 * 点餐模块 — 状态（仅本模块读写，勿挂到全局 Yummi）
 */
(function (global) {
  "use strict";

  var root = global.Yummi.modules.order;

  root.state = {
    create: function () {
      return {
        phase: "idle",
        selectedCategory: null
      };
    },
    reset: function (state) {
      if (!state) return;
      state.phase = "idle";
      state.selectedCategory = null;
    }
  };
})(typeof window !== "undefined" ? window : this);
