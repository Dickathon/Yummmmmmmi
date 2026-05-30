/**
 * 美食街区地图 — 店铺渲染与预览交互
 */
(function (global) {
  "use strict";

  // 店铺数据：文件名 → 中文名、品类、简介
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

  var ASSET_BASE = "source/shop/";

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function renderStreet() {
    var container = document.getElementById("mapStreet");
    if (!container) return;

    // 3×3 街区网格，16个店铺分配到9个街区块
    var blocks = [
      [0, 1],    // 星巴克, 麦当劳
      [2, 3],    // 喜茶, 肯德基
      [4],       // 海底捞
      [5, 6],    // 蜜雪冰城, 瑞幸咖啡
      [7, 8],    // 汉堡王, 茶百道
      [9],       // 必胜客
      [10, 11],  // 奈雪的茶, 赛百味
      [12, 13],  // 一点点, 沪上阿姨
      [14, 15]   // 古茗, 老乡鸡
    ];

    var html = "";

    // 生成9个街区块
    blocks.forEach(function (blockShops) {
      var blockHtml = "";
      blockShops.forEach(function (shopIndex) {
        var shop = SHOPS[shopIndex];
        blockHtml +=
          '<button type="button" class="map-shop" data-shop-index="' + shopIndex + '" aria-label="' + escapeHtml(shop.name) + '">' +
            '<span class="map-shop__icon">' +
              '<img src="' + ASSET_BASE + escapeHtml(shop.file) + '" alt="' + escapeHtml(shop.name) + '" loading="lazy" width="36" height="36">' +
            '</span>' +
            '<span class="map-shop__name">' + escapeHtml(shop.name) + '</span>' +
          '</button>';
      });
      html += '<div class="map-block">' + blockHtml + '</div>';
    });

    // 4个十字路口标记
    var crossPositions = [
      { top: "34%", left: "34%" },
      { top: "34%", left: "66%" },
      { top: "66%", left: "34%" },
      { top: "66%", left: "66%" }
    ];
    crossPositions.forEach(function (pos) {
      html += '<span class="map-crossroad" style="top:' + pos.top + ';left:' + pos.left + ';transform:translate(-50%,-50%)" aria-hidden="true"></span>';
    });

    container.innerHTML = html;
  }

  function setupPreview() {
    var preview = document.getElementById("mapPreview");
    var overlay = document.getElementById("mapPreviewOverlay");
    var closeBtn = document.getElementById("mapPreviewClose");
    var img = document.getElementById("mapPreviewImg");
    var name = document.getElementById("mapPreviewName");
    var tag = document.getElementById("mapPreviewTag");
    var desc = document.getElementById("mapPreviewDesc");
    var street = document.getElementById("mapStreet");

    if (!preview || !street) return;

    function open(index) {
      var shop = SHOPS[index];
      if (!shop) return;

      img.src = ASSET_BASE + shop.file;
      img.alt = shop.name;
      name.textContent = shop.name;
      tag.textContent = shop.tag;
      desc.textContent = shop.desc;

      preview.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function close() {
      preview.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    street.addEventListener("click", function (e) {
      var btn = e.target.closest(".map-shop");
      if (!btn) return;
      var index = parseInt(btn.getAttribute("data-shop-index"), 10);
      if (!isNaN(index)) open(index);
    });

    if (overlay) overlay.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);

    // 点按 ESC 关闭
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && preview.getAttribute("aria-hidden") === "false") {
        close();
      }
    });
  }

  function init() {
    renderStreet();
    setupPreview();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);
