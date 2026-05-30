(function (global) {
  "use strict";

  global.Yummi.modules = global.Yummi.modules || {};
  var root = global.Yummi.modules.dress = global.Yummi.modules.dress || {};

  root.config = {
    id: "dress",
    assetsBase: "assets/modules/dress/",
    meta: {
      label: "装扮",
      title: "装扮",
      desc: "宠物装扮玩法开发中",
      heroClass: "hero--dress"
    }
  };
})(typeof window !== "undefined" ? window : this);
