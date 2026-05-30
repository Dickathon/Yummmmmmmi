/**
 * 装扮模块 — 占位视图（转盘已迁至点餐模块）
 */
(function (global) {
  "use strict";

  var util = global.Yummi.util;
  var root = global.Yummi.modules.dress;

  root.view = {
    render: function () {
      return '<div class="dress-root"></div>';
    },
    bind: function () {},
    unbind: function () {},
    pause: function () {},
    resume: function () {}
  };
})(typeof window !== "undefined" ? window : this);
