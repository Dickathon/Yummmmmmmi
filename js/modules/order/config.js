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
        itemSize: 66,
        placardDrop: 8
      },
      mid: {
        catalogKey: "food2",
        itemSize: 54,
        placardDrop: 7
      },
      top: {
        catalogKey: "food3",
        itemSize: 45,
        placardDrop: 6
      }
    },
    meta: {
      label: "点餐",
      title: "点餐",
      desc: "回转式选菜：每格一道菜，立牌随转盘旋转",
      heroClass: "hero--order"
    },
    /** 与 wmx-temporary/转盘/index.html INITIAL_CONFIG 一致（固化调参结果） */
    turntable: {
      global: {
        offsetX: -1,
        offsetY: -42,
        globalScale: 1.42,
        ellipseRatio: 0.8,
        discHeight: 1.02,
        layerGap: 1
      },
      discLayout: {
        base: { x: 0, y: 79, scale: 1.12, heightScale: 1 },
        mid: { x: 0, y: 37, scale: 1.21, heightScale: 1 },
        top: { x: 0, y: 7, scale: 1.43, heightScale: 1 },
        cap: { x: 0, y: -14, scale: 1.18, heightScale: 1.4 }
      },
      capAssetsBase: "wmx-temporary/转盘/assets/cats/"
    }
  };
})(typeof window !== "undefined" ? window : this);
