(function (global) {
  "use strict";

  global.Yummi.modules = global.Yummi.modules || {};
  var root = global.Yummi.modules.dress = global.Yummi.modules.dress || {};

  /* 每盘 6 格立牌；轮换池为 items-catalog.js 中对应 food1/2/3 全部 WebP */
  root.config = {
    id: "dress",
    assetsBase: "assets/modules/dress/",
    itemsBase: "source/compressed/10kb/",
    sectorCount: 6,
    /** 每层轮换池条数（从目录抽样；三层一致，取 food2/3 满额 15） */
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
      label: "装扮",
      title: "装扮",
      desc: "回转式选菜：每格一道菜，立牌随转盘旋转",
      heroClass: "hero--dress"
    }
  };
})(typeof window !== "undefined" ? window : this);
