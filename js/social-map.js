/**
 * 美食街区地图 — 店铺渲染与预览交互
 */
(function (global) {
  "use strict";

  // 店铺数据：文件名 → 中文名、品类、简介
  var SHOPS = [
    { file: "shop_starbucks-10kb.webp", name: "星巴克", tag: "饮品", desc: "浓郁咖啡香，午后阳光里的温柔驻足。" },
    { file: "shop_mcdonalds-10kb.webp", name: "麦当劳", tag: "主食", desc: "经典滋味，快节奏里的小确幸。" },
    { file: "shop_heytea-10kb.webp", name: "喜茶", tag: "饮品", desc: "灵感之茶，每一杯都是小型创作。" },
    { file: "shop_kfc-10kb.webp", name: "肯德基", tag: "主食", desc: "酥脆吮指，熟悉的味道最安心。" },
    { file: "shop_haidilao-10kb.webp", name: "海底捞", tag: "主食", desc: "热气腾腾的相聚，服务里藏着温度。" },
    { file: "shop_mixue-10kb.webp", name: "蜜雪冰城", tag: "饮品", desc: "平价甜蜜，简单纯粹的快乐。" },
    { file: "shop_luckin-10kb.webp", name: "瑞幸咖啡", tag: "饮品", desc: "便捷好咖啡，日常里的小提神。" },
    { file: "shop_burgerking-10kb.webp", name: "汉堡王", tag: "主食", desc: "火烤风味，大口吃肉的满足。" },
    { file: "shop_chapanda-10kb.webp", name: "茶百道", tag: "饮品", desc: "茶香悠扬，鲜果与奶盖的邂逅。" },
    { file: "shop_pizzahut-10kb.webp", name: "必胜客", tag: "主食", desc: "拉丝芝士，分享时刻的最佳选择。" },
    { file: "shop_nayuki-10kb.webp", name: "奈雪的茶", tag: "饮品", desc: "一杯好茶，一口软欧包的惬意。" },
    { file: "shop_subway-10kb.webp", name: "赛百味", tag: "主食", desc: "新鲜现做，轻盈无负担的三明治。" },
    { file: "shop_alittle_tea-10kb.webp", name: "一点点", tag: "饮品", desc: "台式经典，随心搭配的小满足。" },
    { file: "shop_auntea-10kb.webp", name: "沪上阿姨", tag: "饮品", desc: "五谷茶饮，熬煮出的醇厚温暖。" },
    { file: "shop_goodme-10kb.webp", name: "古茗", tag: "饮品", desc: "江南茶饮，清爽不甜腻的日常。" },
    { file: "shop_laoxiangji-10kb.webp", name: "老乡鸡", tag: "主食", desc: "家常中式快餐，干净卫生的温暖食堂。" }
  ];

  var ASSET_BASE = "source/compressed/10kb/shop/";
  var MAP_CAT_IMG = "source/compressed/10kb/cat2-10kb.webp";

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function renderStreet() {
    var container = document.getElementById("mapStreet");
    if (!container) return;

    // 读取最近一次进入的店铺索引
    var lastShopIndex = -1;
    try {
      var raw = localStorage.getItem("yummi_last_shop");
      if (raw !== null) {
        var parsed = parseInt(raw, 10);
        if (!isNaN(parsed)) lastShopIndex = parsed;
      }
    } catch (e) {}

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
        var catHtml = (shopIndex === lastShopIndex)
          ? '<img class="map-shop__cat" src="' + MAP_CAT_IMG + '" alt="" aria-hidden="true" width="34" height="34">'
          : '';
        blockHtml +=
          '<button type="button" class="map-shop" data-shop-index="' + shopIndex + '" aria-label="' + escapeHtml(shop.name) + '">' +
            '<span class="map-shop__icon">' +
              '<img src="' + ASSET_BASE + escapeHtml(shop.file) + '" alt="' + escapeHtml(shop.name) + '" loading="lazy" width="36" height="36">' +
            '</span>' +
            catHtml +
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

    // 路灯 — 分布在道路段中间，避开十字路口（12盏）
    var lampPositions = [
      // 横向道路1 上侧 — 3段道路中间
      { top: "28%", left: "20%" }, { top: "28%", left: "50%" }, { top: "28%", left: "80%" },
      // 横向道路2 下侧 — 3段道路中间
      { top: "72%", left: "20%" }, { top: "72%", left: "50%" }, { top: "72%", left: "80%" },
      // 纵向道路1 左侧 — 3段道路中间
      { top: "20%", left: "30%" }, { top: "50%", left: "30%" }, { top: "80%", left: "30%" },
      // 纵向道路2 右侧 — 3段道路中间
      { top: "20%", left: "70%" }, { top: "50%", left: "70%" }, { top: "80%", left: "70%" }
    ];
    lampPositions.forEach(function (pos) {
      html += '<span class="map-lamp" style="top:' + pos.top + ';left:' + pos.left + ';transform:translate(-50%,-50%)" aria-hidden="true"></span>';
    });

    // 斑马线 — 每个十字路口4组（16组）
    var zebras = [
      // 路口1 (34%, 34%)
      { top: "30%", left: "34%", cls: "map-zebra-hroad" },
      { top: "38%", left: "34%", cls: "map-zebra-hroad" },
      { top: "34%", left: "30%", cls: "map-zebra-vroad" },
      { top: "34%", left: "38%", cls: "map-zebra-vroad" },
      // 路口2 (34%, 66%)
      { top: "30%", left: "66%", cls: "map-zebra-hroad" },
      { top: "38%", left: "66%", cls: "map-zebra-hroad" },
      { top: "34%", left: "62%", cls: "map-zebra-vroad" },
      { top: "34%", left: "70%", cls: "map-zebra-vroad" },
      // 路口3 (66%, 34%)
      { top: "62%", left: "34%", cls: "map-zebra-hroad" },
      { top: "70%", left: "34%", cls: "map-zebra-hroad" },
      { top: "66%", left: "30%", cls: "map-zebra-vroad" },
      { top: "66%", left: "38%", cls: "map-zebra-vroad" },
      // 路口4 (66%, 66%)
      { top: "62%", left: "66%", cls: "map-zebra-hroad" },
      { top: "70%", left: "66%", cls: "map-zebra-hroad" },
      { top: "66%", left: "62%", cls: "map-zebra-vroad" },
      { top: "66%", left: "70%", cls: "map-zebra-vroad" }
    ];
    zebras.forEach(function (z) {
      html += '<span class="' + z.cls + '" style="top:' + z.top + ';left:' + z.left + ';transform:translate(-50%,-50%)" aria-hidden="true"></span>';
    });

    // 车辆 — 4辆，分布在横纵道路上，带移动动画
    var cars = [
      { top: "33%", left: "50%", cls: "map-car--right", color: "#f4e1e1" },
      { top: "66%", left: "40%", cls: "map-car--left", color: "#8fbc8f" },
      { top: "40%", left: "33%", cls: "map-car--down", color: "#9caf88" },
      { top: "60%", left: "66%", cls: "map-car--up", color: "#c4a882" }
    ];
    cars.forEach(function (car) {
      html += '<span class="map-car ' + car.cls + '" style="top:' + car.top + ';left:' + car.left + ';background:' + car.color + '" aria-hidden="true"></span>';
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
    var enterBtn = document.getElementById("mapPreviewEnter");
    var circleBtn = document.getElementById("mapCircleBtn");
    var friendsBtn = document.getElementById("mapFriendsBtn");
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

      // 预留：将当前店铺索引绑定到按钮，供后续跳转使用
      if (enterBtn) enterBtn.setAttribute("data-shop-index", index);

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
      if (isNaN(index)) return;
      try {
        localStorage.setItem("yummi_last_shop", String(index));
      } catch (e) {}
      window.location.href = "shop.html?shop=" + index;
    });

    if (overlay) overlay.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);

    // 进入店铺按钮 — 跳转店铺详情页
    if (enterBtn) {
      enterBtn.addEventListener("click", function () {
        var index = parseInt(enterBtn.getAttribute("data-shop-index"), 10);
        if (isNaN(index)) return;
        try {
          localStorage.setItem("yummi_last_shop", String(index));
        } catch (e) {}
        window.location.href = "shop.html?shop=" + index;
      });
    }

    // 食物圈按钮 — 跳转食物圈页面
    if (circleBtn) {
      circleBtn.addEventListener("click", function () {
        window.location.href = "food-circle.html";
      });
    }

    // 好友按钮 — 跳转好友页面
    if (friendsBtn) {
      friendsBtn.addEventListener("click", function () {
        window.location.href = "friends.html";
      });
    }

    // 点按 ESC 关闭
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && preview.getAttribute("aria-hidden") === "false") {
        close();
      }
    });
  }

  function setupGuide() {
    var guide = document.getElementById("mapGuide");
    var overlay = document.getElementById("mapGuideOverlay");
    var btn = document.getElementById("mapGuideBtn");
    if (!guide) return;

    // 双重保险：localStorage 持久标记 + sessionStorage 会话标记
    var seen = false;
    try {
      seen = localStorage.getItem("yummi_guide_seen") === "1" ||
             sessionStorage.getItem("yummi_guide_seen") === "1";
    } catch (e) {}

    if (seen) return;

    guide.setAttribute("aria-hidden", "false");

    function dismiss() {
      guide.setAttribute("aria-hidden", "true");
      try {
        localStorage.setItem("yummi_guide_seen", "1");
        sessionStorage.setItem("yummi_guide_seen", "1");
      } catch (e) {}
    }

    if (btn) btn.addEventListener("click", dismiss);
    if (overlay) overlay.addEventListener("click", dismiss);
  }

  function init() {
    renderStreet();
    setupPreview();
    setupGuide();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);
