/**
 * 点餐模块 — 配置（三层椭圆转盘 + 食物轮换池）
 */
(function (global) {
  "use strict";

  global.Yummi.modules = global.Yummi.modules || {};
  var root = global.Yummi.modules.order = global.Yummi.modules.order || {};

  root.config = {
    id: "order",
    assetsBase: "assets/modules/order/",
    itemsBase: "source/compressed/10kb/",
    sectorCount: 6,
    poolSizePerDisc: 15,
    discs: {
      base: {
        catalogKey: "food1",
        itemSize: 56,
        placardDrop: 7
      },
      mid: {
        catalogKey: "food2",
        itemSize: 46,
        placardDrop: 6
      },
      top: {
        catalogKey: "food3",
        itemSize: 38,
        placardDrop: 5
      }
    },
    meta: {
      label: "点餐",
      title: "点餐",
      desc: "回转式选菜：每格一道菜，立牌随转盘旋转",
      heroClass: "hero--order"
    }
  };
})(typeof window !== "undefined" ? window : this);
