(function (global) {
  "use strict";

  var root = global.Yummi.modules.dress;

  root.state = {
    create: function () {
      return {
        phase: "idle",
        equipped: []
      };
    },
    reset: function (state) {
      if (!state) return;
      state.phase = "idle";
      state.equipped = [];
    }
  };
})(typeof window !== "undefined" ? window : this);
