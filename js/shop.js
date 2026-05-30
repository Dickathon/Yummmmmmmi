/**
 * 店铺详情页 — 背景展示与食客留言
 */
(function (global) {
  "use strict";

  // 店铺数据（与 social-map.js 保持一致）
  var SHOPS = [
    { file: "shop_starbucks.png", name: "星巴克", tag: "饮品", desc: "浓郁咖啡香，午后阳光里的温柔驻足。" },
    { file: "shop_mcdonalds.png", name: "麦当劳", tag: "主食", desc: "经典滋味，快节奏里的小确幸。" },
    { file: "shop_heytea.png", name: "喜茶", tag: "饮品", desc: "灵感之茶，每一杯都是小型创作。" },
    { file: "shop_kfc.png", name: "肯德基", tag: "主食", desc: "酥脆吮指，熟悉的味道最安心。" },
    { file: "shop_haidilao.png", name: "海底捞", tag: "主食", desc: "热气腾腾的相聚，服务里藏着温度。" },
    { file: "shop_mixue.png", name: "蜜雪冰城", tag: "饮品", desc: "平价甜蜜，简单纯粹的快乐。" },
    { file: "shop_luckin.png", name: "瑞幸咖啡", tag: "饮品", desc: "便捷好咖啡，日常里的小提神。" },
    { file: "shop_burgerking.png", name: "汉堡王", tag: "主食", desc: "火烤风味，大口吃肉的满足。" },
    { file: "shop_chapanda.png", name: "茶百道", tag: "饮品", desc: "茶香悠扬，鲜果与奶盖的邂逅。" },
    { file: "shop_pizzahut.png", name: "必胜客", tag: "主食", desc: "拉丝芝士，分享时刻的最佳选择。" },
    { file: "shop_nayuki.png", name: "奈雪的茶", tag: "饮品", desc: "一杯好茶，一口软欧包的惬意。" },
    { file: "shop_subway.png", name: "赛百味", tag: "主食", desc: "新鲜现做，轻盈无负担的三明治。" },
    { file: "shop_alittle_tea.png", name: "一点点", tag: "饮品", desc: "台式经典，随心搭配的小满足。" },
    { file: "shop_auntea.png", name: "沪上阿姨", tag: "饮品", desc: "五谷茶饮，熬煮出的醇厚温暖。" },
    { file: "shop_goodme.png", name: "古茗", tag: "饮品", desc: "江南茶饮，清爽不甜腻的日常。" },
    { file: "shop_laoxiangji.png", name: "老乡鸡", tag: "主食", desc: "家常中式快餐，干净卫生的温暖食堂。" }
  ];

  var SVG_BASE = "source/svgSHOP/";

  // ============================================================
  // 【小猫位置配置】每个店铺独立配置，可手动调整
  //
  // 说明：
  //   - SHOP_CATS 是一个数组，索引 0~15 对应 16 个店铺
  //   - 每个店铺对应一个「小猫数组」，里面放 2~4 只猫
  //   - 每只猫是一个对象，包含以下字段：
  //       img   : 图片路径（如 "source/CatImage/cat1.jpg"）
  //       left  : 距离背景左侧的距离（百分比如 "30%" 或像素如 "100px"）
  //       top   : 距离背景顶部的距离（百分比如 "60%" 或像素如 "200px"）
  //       width : 图片显示宽度（如 "40px"）
  //       alt   : 图片描述（可选）
  //
  // 当前店铺顺序（与 SHOPS 数组对应）：
  //   0=星巴克  1=麦当劳  2=喜茶  3=肯德基  4=海底捞  5=蜜雪冰城
  //   6=瑞幸    7=汉堡王  8=茶百道 9=必胜客 10=奈雪   11=赛百味
  //   12=一点点 13=沪上阿姨 14=古茗 15=老乡鸡
  // ============================================================
  var SHOP_CATS = [
    // 0 星巴克
    [
      { img: "source/CatImage/cat2.png",  left: "40%", top: "80%", width: "42px", alt: "小猫A" },
      { img: "source/CatImage/cat3.png",  left: "55%", top: "72%", width: "38px", alt: "小猫B" },
    ],
    // 1 麦当劳
    [
      { img: "source/CatImage/cat2.png", left: "25%", top: "80%", width: "40px", alt: "小猫A" },
      { img: "source/CatImage/cat4.png",  left: "60%", top: "65%", width: "36px", alt: "小猫B" },
      { img: "source/CatImage/cat5.png",  left: "45%", top: "85%", width: "44px", alt: "小猫C" },
    ],
    // 2 喜茶
    [
      { img: "source/CatImage/cat5.png",  left: "30%", top: "70%", width: "38px", alt: "小猫A" },
      { img: "source/CatImage/cat2.png", left: "70%", top: "65%", width: "42px", alt: "小猫B" },
    ],
    // 3 肯德基
    [
      { img: "source/CatImage/cat3.png",  left: "15%", top: "58%", width: "40px", alt: "小猫A" },
      { img: "source/CatImage/cat4.png",  left: "50%", top: "75%", width: "36px", alt: "小猫B" },
      { img: "source/CatImage/cat5.png",  left: "10%", top: "85%", width: "44px", alt: "小猫C" },
    ],
    // 4 海底捞
    [
      
      { img: "source/CatImage/cat3.png", left: "60%", top: "68%", width: "38px", alt: "小猫B" },
    ],
    // 5 蜜雪冰城
    [
      { img: "source/CatImage/cat3.png",  left: "15%", top: "57%", width: "40px", alt: "小猫A" },
      { img: "source/CatImage/cat4.png",  left: "75%", top: "72%", width: "36px", alt: "小猫B" },
      { img: "source/CatImage/cat5.png",  left: "55%", top: "82%", width: "42px", alt: "小猫C" },
    ],
    // 6 瑞幸咖啡
    [
      { img: "source/CatImage/cat5.png",  left: "19%", top: "55%", width: "38px", alt: "小猫A" },
      { img: "source/CatImage/cat2.png", left: "68%", top: "75%", width: "44px", alt: "小猫B" },
    ],
    // 7 汉堡王
    [
      { img: "source/CatImage/cat3.png",  left: "18%", top: "70%", width: "40px", alt: "小猫A" },
      
      { img: "source/CatImage/cat5.png",  left: "40%", top: "78%", width: "42px", alt: "小猫C" },
    ],
    // 8 茶百道
    [
      { img: "source/CatImage/cat3.png",  left: "37%", top: "63%", width: "40px", alt: "小猫A" },
      { img: "source/CatImage/cat2.png", left: "54%", top: "63%", width: "38px", alt: "小猫B" },
    ],
    // 9 必胜客
    [
      { img: "source/CatImage/cat3.png",  left: "10%", top: "53%", width: "42px", alt: "小猫A" },
      { img: "source/CatImage/cat4.png",  left: "64%", top: "70%", width: "36px", alt: "小猫B" },
      { img: "source/CatImage/cat5.png",  left: "44%", top: "80%", width: "44px", alt: "小猫C" },
    ],
    // 10 奈雪的茶
    [
      { img: "source/CatImage/cat5.png",  left: "26%", top: "85%", width: "38px", alt: "小猫A" },
      
    ],
    // 11 赛百味
    [
      { img: "source/CatImage/cat3.png",  left: "20%", top: "69%", width: "40px", alt: "小猫A" },
      
      { img: "source/CatImage/cat5.png",  left: "80%", top: "76%", width: "42px", alt: "小猫C" },
    ],
    // 12 一点点
    [
      { img: "source/CatImage/cat4.png",  left: "15%", top: "64%", width: "40px", alt: "小猫A" },
      { img: "source/CatImage/cat5.png", left: "74%", top: "85%", width: "38px", alt: "小猫B" },
    ],
    // 13 沪上阿姨
    [
      { img: "source/CatImage/cat3.png",  left: "16%", top: "64%", width: "42px", alt: "小猫A" },
      { img: "source/CatImage/cat4.png",  left: "56%", top: "73%", width: "36px", alt: "小猫B" },
      { img: "source/CatImage/cat5.png",  left: "38%", top: "83%", width: "44px", alt: "小猫C" },
    ],
    // 14 古茗
    [
      { img: "source/CatImage/cat4.png",  left: "30%", top: "85%", width: "38px", alt: "小猫A" },
      
    ],
    // 15 老乡鸡
    [
      { img: "source/CatImage/cat3.png",  left: "22%", top: "56%", width: "40px", alt: "小猫A" },
      { img: "source/CatImage/cat4.png",  left: "62%", top: "73%", width: "36px", alt: "小猫B" },
      
    ],
  ];
  // ============================================================

  function getParam(name) {
    var search = window.location.search;
    if (!search) return "";
    var pairs = search.slice(1).split("&");
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i].split("=");
      if (decodeURIComponent(pair[0]) === name) {
        return decodeURIComponent(pair[1] || "");
      }
    }
    return "";
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function getShopIndex() {
    var raw = getParam("shop");
    var index = parseInt(raw, 10);
    if (isNaN(index) || index < 0 || index >= SHOPS.length) return -1;
    return index;
  }

  function getSvgFile(shopFile) {
    // shop_starbucks.png → starbucks → interior_starbucks.svg
    var name = shopFile.replace(/^shop_/, "").replace(/\.png$/, "");
    return SVG_BASE + "interior_" + name + ".svg";
  }

  function init() {
    var index = getShopIndex();
    if (index === -1) {
      document.body.innerHTML =
        '<div class="shop-error">' +
          '<p class="shop-error__text">店铺不存在</p>' +
          '<a href="social-map.html" class="shop-back" style="position:static;">返回街区</a>' +
        '</div>';
      return;
    }

    var shop = SHOPS[index];

    var bgImg = document.getElementById("shopBgImg");
    if (bgImg) {
      bgImg.src = getSvgFile(shop.file);
      bgImg.alt = shop.name + "店内";
    }

    // 渲染该店铺的小猫
    var catsContainer = document.getElementById("shopCats");
    if (catsContainer) {
      var cats = SHOP_CATS[index] || [];
      var html = "";
      for (var i = 0; i < cats.length; i++) {
        var c = cats[i];
        html +=
          '<div class="shop-cat" style="left:' + escapeHtml(c.left) +
          ';top:' + escapeHtml(c.top) + ';">' +
            '<img class="shop-cat__img" src="' + escapeHtml(c.img) +
            '" alt="' + escapeHtml(c.alt || "小猫") +
            '" width="' + escapeHtml(c.width) +
            '" style="width:' + escapeHtml(c.width) + ';">' +
          '</div>';
      }
      catsContainer.innerHTML = html;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);
