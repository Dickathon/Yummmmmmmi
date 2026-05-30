(function (global) {
  "use strict";

  global.Yummi.modules = global.Yummi.modules || {};
  var root = global.Yummi.modules.dress = global.Yummi.modules.dress || {};

  /* 每盘 6 格，items[0..5] 与格子 index 一一对应（旋转小火锅） */
  root.config = {
    id: "dress",
    assetsBase: "assets/modules/dress/",
    itemsBase: "source/compressed/10kb/",
    sectorCount: 6,
    discs: {
      base: {
        itemSize: 56,
        placardDrop: 7,
        items: [
          "food1/寿司-10kb.webp",
          "food1/披萨-10kb.webp",
          "food1/火锅-10kb.webp",
          "food1/北京烤鸭-10kb.webp",
          "food1/汉堡-10kb.webp",
          "food1/日式拉面-10kb.webp"
        ]
      },
      mid: {
        itemSize: 46,
        placardDrop: 6,
        items: [
          "food2/奶油蛋糕-10kb.webp",
          "food2/葡式蛋挞-10kb.webp",
          "food2/芒果冰沙-10kb.webp",
          "food2/黄油曲奇-10kb.webp",
          "food2/焦糖布丁-10kb.webp",
          "food2/香草冰淇淋-10kb.webp"
        ]
      },
      top: {
        itemSize: 38,
        placardDrop: 5,
        items: [
          "food3/珍珠奶茶-10kb.webp",
          "food3/抹茶奶茶-10kb.webp",
          "food3/可乐-10kb.webp",
          "food3/美式咖啡-10kb.webp",
          "food3/龙井茶-10kb.webp",
          "food3/青岛啤酒-10kb.webp"
        ]
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
