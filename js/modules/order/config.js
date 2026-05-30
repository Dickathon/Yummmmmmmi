/**
 * 点餐模块 — 配置（负责人主要改此文件中的文案与 meta）
 */
(function (global) {
  "use strict";

  global.Yummi.modules = global.Yummi.modules || {};
  var root = global.Yummi.modules.order = global.Yummi.modules.order || {};

  root.config = {
    id: "order",
    assetsBase: "assets/modules/order/",
    meta: {
      label: "点餐",
      title: "点餐",
      desc: "挑选美食，像走进京都小巷里的茶室",
      heroClass: "hero--order"
    }
  };
})(typeof window !== "undefined" ? window : this);
