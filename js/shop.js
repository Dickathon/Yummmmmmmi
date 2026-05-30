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

  // 虚构食客留言数据
  var REVIEWS = [
    // 星巴克 [0]
    [
      { user: "小鹿", food: "美式咖啡", text: "每天早上的精神支柱，苦得刚刚好。" },
      { user: "阿茶", food: "奶油蛋糕", text: "二楼靠窗的位置最适合发呆，咖啡配蛋糕，下午就这么过去了。" }
    ],
    // 麦当劳 [1]
    [
      { user: "大胃王", food: "汉堡", text: "薯条永远是刚出锅的最好吃，酥脆满分。" },
      { user: "小黄", food: "炸鸡", text: "周末带小朋友来，开心乐园餐的玩具收集了一抽屉。" }
    ],
    // 喜茶 [2]
    [
      { user: "甜甜", food: "珍珠奶茶", text: "多肉葡萄永远的神，层次感太丰富了。" },
      { user: "木子", food: "芒果冰沙", text: "排队二十分钟也值得，第一口就被治愈了。" }
    ],
    // 肯德基 [3]
    [
      { user: "脆皮控", food: "炸鸡", text: "原味鸡的脆皮是无可替代的童年记忆。" },
      { user: "可乐加冰", food: "薯条", text: "疯狂星期四不来一趟，总觉得这周少了点什么。" }
    ],
    // 海底捞 [4]
    [
      { user: "火锅仙子", food: "火锅", text: "一个人来吃也不会尴尬，服务太贴心了。" },
      { user: "麻酱党", food: "麻辣小龙虾", text: "番茄锅yyds，最后一定要下一碗面。" }
    ],
    // 蜜雪冰城 [5]
    [
      { user: "学生仔", food: "冰淇淋", text: "四块钱的柠檬水，夏天救命神器。" },
      { user: "雪王", food: "珍珠奶茶", text: "便宜又大碗，还要什么自行车。" }
    ],
    // 瑞幸咖啡 [6]
    [
      { user: "打工人", food: "美式咖啡", text: "9.9的生椰拿铁，续命神器。" },
      { user: "早起鸟", food: "芝士奶酪块", text: "公司楼下就有，取餐不用排队，效率max。" }
    ],
    // 汉堡王 [7]
    [
      { user: "肉食者", food: "汉堡", text: "皇堡的牛肉饼汁水很足，火烤香味独一无二。" },
      { user: "洋葱圈", food: "薯条", text: "洋葱圈比薯条还上瘾，每次必点。" }
    ],
    // 茶百道 [8]
    [
      { user: "芋泥控", food: "珍珠奶茶", text: "豆乳玉麒麟的口感好绵密，芋圆很有嚼劲。" },
      { user: "水果脑袋", food: "水果捞", text: "西瓜啵啵清爽解腻，夏天必喝。" }
    ],
    // 必胜客 [9]
    [
      { user: "芝士狂", food: "披萨", text: "超级至尊的料太足了，两个人吃一个刚好。" },
      { user: "意面控", food: "意大利面", text: "奶油蘑菇汤配蒜香面包，永远的经典组合。" }
    ],
    // 奈雪的茶 [10]
    [
      { user: "欧包迷", food: "奶油泡芙", text: "霸气芝士草莓配上草莓魔法棒，幸福感爆棚。" },
      { user: "茉莉", food: "龙井茶", text: "Pro店的座位很宽敞，适合带电脑来办公。" }
    ],
    // 赛百味 [11]
    [
      { user: "减脂党", food: "蔬菜沙拉", text: "全麦面包加鸡胸肉，健身餐首选。" },
      { user: "芥末酱", food: "三明治", text: "蜂蜜芥末酱是灵魂，让三明治不再枯燥。" }
    ],
    // 一点点 [12]
    [
      { user: "波霸", food: "珍珠奶茶", text: "三分糖去冰加波霸，永远不会出错。" },
      { user: "四季春", food: "冰红茶", text: "四季春茶底很清香，搭配奶霜绝了。" }
    ],
    // 沪上阿姨 [13]
    [
      { user: "血糯米", food: "珍珠奶茶", text: "血糯米奶茶很有饱腹感，可以当下午茶。" },
      { user: "养生派", food: "姜糖水", text: "姨妈期来一杯热的，比男朋友还暖。" }
    ],
    // 古茗 [14]
    [
      { user: "江南客", food: "珍珠奶茶", text: "布蕾脆脆奶芙的奶盖很厚，满足感很强。" },
      { user: "杨枝", food: "固体杨枝甘露", text: "杨枝甘露清爽不甜腻，芒果很新鲜。" }
    ],
    // 老乡鸡 [15]
    [
      { user: "干饭人", food: "红烧肉", text: "肥西老母鸡汤太鲜了，一碗下去整个人都暖了。" },
      { user: "工作餐", food: "麻婆豆腐", text: "干净卫生出餐快，打工人的食堂。" }
    ]
  ];

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

  function getAvatarInitial(name) {
    return name.charAt(0);
  }

  function renderReviews(reviews) {
    var container = document.getElementById("shopReviews");
    if (!container) return;

    var html = "";
    reviews.forEach(function (review) {
      var visits = review.visits || Math.floor(Math.random() * 4) + 2;
      html +=
        '<div class="review-card">' +
          '<div class="review-card__header">' +
            '<span class="review-card__avatar">' + escapeHtml(getAvatarInitial(review.user)) + '</span>' +
            '<div class="review-card__meta">' +
              '<span class="review-card__name">' + escapeHtml(review.user) + '</span>' +
              '<span class="review-card__food">喜欢' + escapeHtml(review.food) + '<span class="review-card__visits">最近来过 ' + visits + ' 次</span></span>' +
            '</div>' +
            '<button type="button" class="review-card__dm" aria-label="私信留言">私信留言</button>' +
          '</div>' +
          '<p class="review-card__text">' + escapeHtml(review.text) + '</p>' +
        '</div>';
    });
    container.innerHTML = html;
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
    var reviews = REVIEWS[index] || [];

    var bgImg = document.getElementById("shopBgImg");
    var shopName = document.getElementById("shopName");
    var shopTag = document.getElementById("shopTag");
    var shopDesc = document.getElementById("shopDesc");

    if (bgImg) {
      bgImg.src = getSvgFile(shop.file);
      bgImg.alt = shop.name + "店内";
    }
    if (shopName) shopName.textContent = shop.name;
    if (shopTag) shopTag.textContent = shop.tag;
    if (shopDesc) shopDesc.textContent = shop.desc;

    renderReviews(reviews);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);
