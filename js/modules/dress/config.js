(function (global) {
  "use strict";

  global.Yummi.modules = global.Yummi.modules || {};
  var root = global.Yummi.modules.dress = global.Yummi.modules.dress || {};

  root.config = {
    id: "dress",
    assetsBase: "assets/modules/dress/",
    meta: {
      label: "装扮",
      title: "椭圆转盘",
      desc: "三层独立椭圆盘围绕同轴中心自转，拖动任意可见盘面即可单独控制。",
      heroClass: "hero--dress"
    }
  };
})(typeof window !== "undefined" ? window : this);
