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

    // 渲染该店铺的小猫（绑定访客数据）
    var catsContainer = document.getElementById("shopCats");
    if (catsContainer) {
      var cats = SHOP_CATS[index] || [];
      var visitors = VISITOR_DATA[index] || [];
      var html = "";
      for (var i = 0; i < cats.length; i++) {
        var c = cats[i];
        var v = visitors[i] || visitors[0];
        html +=
          '<div class="shop-cat" style="left:' + escapeHtml(c.left) +
          ';top:' + escapeHtml(c.top) + ';" data-visitor-index="' + i + '">' +
            '<img class="shop-cat__img" src="' + escapeHtml(c.img) +
            '" alt="' + escapeHtml(c.alt || "小猫") +
            '" width="' + escapeHtml(c.width) +
            '" style="width:' + escapeHtml(c.width) + ';">' +
          '</div>';
      }
      catsContainer.innerHTML = html;
      bindCatClicks(catsContainer, visitors);
    }
  }

  // ============================================================
  // 【访客虚构数据】每个店铺对应访客，与小猫一一对应
  // ============================================================
  var VISITOR_DATA = [
    // 0 星巴克
    [
      { name: "小橘", avatar: "🐱", visits: 12, message: "这里的拿铁是我的最爱，每次来都要坐窗边发呆。", preference: { items: "拿铁、美式", seat: "靠窗位", sweetness: "半糖", time: "下午2点" } },
      { name: "阿白", avatar: "🐈", visits: 5, message: "带朋友来过两次，环境很安静适合聊天。", preference: { items: "焦糖玛奇朵", seat: "沙发区", sweetness: "标准糖", time: "周末上午" } },
    ],
    // 1 麦当劳
    [
      { name: "胖橘", avatar: "🐱", visits: 28, message: "麦辣鸡腿堡永远的神！已经吃了一个月了。", preference: { items: "麦辣鸡腿堡、薯条", seat: "无所谓", sweetness: "可乐去冰", time: "中午12点" } },
      { name: "三花", avatar: "🐈", visits: 7, message: "甜筒第二件半价的时候必来。", preference: { items: "甜筒、麦旋风", seat: "靠门", sweetness: "原味", time: "晚上8点" } },
      { name: "黑猫", avatar: "🐈‍⬛", visits: 3, message: "早餐的卡布奇诺套餐性价比很高。", preference: { items: "早餐全餐", seat: "吧台", sweetness: "咖啡不加糖", time: "早上7点半" } },
    ],
    // 2 喜茶
    [
      { name: "奶茶猫", avatar: "🐱", visits: 15, message: "芋泥波波牛乳YYDS，每次都要加双倍芋泥！", preference: { items: "芋泥波波牛乳", seat: "二楼", sweetness: "少少甜", time: "下午3点" } },
      { name: "奶盖", avatar: "🐈", visits: 9, message: "芝士奶盖系列没有踩雷过，推荐！", preference: { items: "芝芝莓莓、多肉葡萄", seat: "角落", sweetness: "标准甜", time: "傍晚6点" } },
    ],
    // 3 肯德基
    [
      { name: "炸鸡控", avatar: "🐱", visits: 20, message: "原味鸡要三角部位的，懂得都懂。", preference: { items: "原味鸡、土豆泥", seat: "四人桌", sweetness: "九珍果汁", time: "周四下午" } },
      { name: "蛋挞猫", avatar: "🐈", visits: 8, message: "葡式蛋挞刚出炉的时候最好吃，外酥里嫩。", preference: { items: "葡式蛋挞", seat: "靠窗", sweetness: "蛋挞原味", time: "下午茶时间" } },
      { name: "汉堡", avatar: "🐈‍⬛", visits: 4, message: "嫩牛五方回归的时候激动坏了。", preference: { items: "嫩牛五方", seat: "卡座", sweetness: "可乐", time: "晚餐" } },
    ],
    // 4 海底捞
    [
      { name: "火锅猫", avatar: "🐱", visits: 10, message: "一个人来吃火锅也很开心，服务员超贴心。", preference: { items: "毛肚、虾滑、肥牛", seat: "四人桌", sweetness: "酸梅汤", time: "晚上7点" } },
      { name: "番茄", avatar: "🐈", visits: 6, message: "番茄锅汤底可以喝三碗，每次必点。", preference: { items: "番茄锅", seat: "包厢", sweetness: "西瓜", time: "周末中午" } },
    ],
    // 5 蜜雪冰城
    [
      { name: "雪王", avatar: "🐱", visits: 30, message: "四块钱的柠檬水还要什么自行车！", preference: { items: "柠檬水、摩天脆脆", seat: "门口", sweetness: "正常甜", time: "随时" } },
      { name: "甜筒猫", avatar: "🐈", visits: 15, message: "两块钱的甜筒比KFC的还好吃。", preference: { items: "摩天脆脆", seat: "无所谓", sweetness: "原味", time: "夏天" } },
      { name: "蜜桃", avatar: "🐈‍⬛", visits: 8, message: "蜜桃四季春是隐藏宝藏。", preference: { items: "蜜桃四季春", seat: "角落", sweetness: "七分甜", time: "下午" } },
    ],
    // 6 瑞幸咖啡
    [
      { name: "生椰", avatar: "🐱", visits: 18, message: "生椰拿铁拯救了我的早八，每天一杯。", preference: { items: "生椰拿铁", seat: "靠窗", sweetness: "不另外加糖", time: "早上8点" } },
      { name: "美式", avatar: "🐈", visits: 11, message: "美式提神效果一流，工作必备。", preference: { items: "冰美式", seat: "高脚凳", sweetness: "无糖", time: "下午2点" } },
    ],
    // 7 汉堡王
    [
      { name: "火烤", avatar: "🐱", visits: 14, message: "皇堡的肉饼是真的厚实，火烤味很香。", preference: { items: "皇堡、洋葱圈", seat: "沙发", sweetness: "可乐", time: "午餐" } },
      { name: "薯条", avatar: "🐈", visits: 6, message: "粗薯条比细的好吃多了，外脆里糯。", preference: { items: "粗薯条", seat: "吧台", sweetness: "番茄酱", time: "下午茶" } },
      { name: "鸡条", avatar: "🐈‍⬛", visits: 3, message: "王道椒香鸡腿偶尔换换口味不错。", preference: { items: "王道椒香鸡腿", seat: "角落", sweetness: "可乐", time: "晚餐" } },
    ],
    // 8 茶百道
    [
      { name: "豆乳", avatar: "🐱", visits: 13, message: "豆乳玉麒麟上面的黄豆粉绝了，必喝。", preference: { items: "豆乳玉麒麟", seat: "靠窗", sweetness: "三分糖", time: "下午4点" } },
      { name: "杨枝", avatar: "🐈", visits: 7, message: "杨枝甘露料超足，每次都要多加西米。", preference: { items: "杨枝甘露", seat: "沙发", sweetness: "标准甜", time: "傍晚" } },
    ],
    // 9 必胜客
    [
      { name: "芝士", avatar: "🐱", visits: 9, message: "超级至尊披萨的芝士能拉好长的丝！", preference: { items: "超级至尊披萨", seat: "卡座", sweetness: "柠檬茶", time: "周末中午" } },
      { name: "意面", avatar: "🐈", visits: 5, message: "肉酱意面分量很足，一个人吃刚好。", preference: { items: "经典肉酱意面", seat: "窗边", sweetness: "柠檬红茶", time: "晚餐" } },
      { name: "小吃", avatar: "🐈‍⬛", visits: 2, message: "凤尾虾和烤翅拼盘是聚餐必点。", preference: { items: "凤尾虾、烤翅", seat: "大桌", sweetness: "可乐", time: "聚餐" } },
    ],
    // 10 奈雪的茶
    [
      { name: "欧包", avatar: "🐱", visits: 16, message: "霸气芝士草莓+榴莲欧包，完美下午茶。", preference: { items: "霸气芝士草莓", seat: "二楼", sweetness: "标准甜", time: "下午3点" } },
      { name: "葡萄", avatar: "🐈", visits: 8, message: "多肉葡萄的果肉好多，每口都能嚼到。", preference: { items: "多肉葡萄", seat: "角落", sweetness: "少甜", time: "下午5点" } },
    ],
    // 11 赛百味
    [
      { name: "三明治", avatar: "🐱", visits: 11, message: "全麦面包+火鸡胸+蜂蜜芥末酱，减脂神器。", preference: { items: "火鸡胸三明治", seat: "高脚凳", sweetness: "蜂蜜芥末", time: "午餐" } },
      { name: "曲奇", avatar: "🐈", visits: 4, message: "白巧克力曲奇加热后超好吃。", preference: { items: "白巧克力曲奇", seat: "窗边", sweetness: "原味", time: "下午茶" } },
      { name: "金枪鱼", avatar: "🐈‍⬛", visits: 6, message: "金枪鱼三明治馅料很多，不会饿。", preference: { items: "金枪鱼三明治", seat: "吧台", sweetness: "蛋黄酱", time: "晚餐" } },
    ],
    // 12 一点点
    [
      { name: "波霸", avatar: "🐱", visits: 22, message: "波霸奶茶三分糖去冰，喝了三年没变过。", preference: { items: "波霸奶茶", seat: "门口", sweetness: "三分糖", time: "随时" } },
      { name: "四季", avatar: "🐈", visits: 10, message: "四季春茶加奶霜，清爽不腻。", preference: { items: "四季春茶+奶霜", seat: "角落", sweetness: "五分糖", time: "夏天" } },
    ],
    // 13 沪上阿姨
    [
      { name: "血糯米", avatar: "🐱", visits: 17, message: "血糯米奶茶饱腹感很强，可以当早餐。", preference: { items: "血糯米奶茶", seat: "沙发", sweetness: "五分糖", time: "早上10点" } },
      { name: "杨枝", avatar: "🐈", visits: 9, message: "杨枝甘露清爽版更适合夏天。", preference: { items: "杨枝甘露清爽版", seat: "窗边", sweetness: "七分糖", time: "下午" } },
      { name: "芋泥", avatar: "🐈‍⬛", visits: 5, message: "芋泥波波奶茶芋泥给好多，满足。", preference: { items: "芋泥波波奶茶", seat: "卡座", sweetness: "标准糖", time: "晚上" } },
    ],
    // 14 古茗
    [
      { name: "布蕾", avatar: "🐱", visits: 14, message: "布雷脆脆奶芙上面的碧根果碎好香！", preference: { items: "布雷脆脆奶芙", seat: "靠窗", sweetness: "五分糖", time: "下午茶" } },
      { name: "大叔", avatar: "🐈", visits: 8, message: "大叔奶茶珍珠煮得刚刚好，有嚼劲。", preference: { items: "大叔奶茶", seat: "吧台", sweetness: "七分糖", time: "晚上7点" } },
    ],
    // 15 老乡鸡
    [
      { name: "肥西", avatar: "🐱", visits: 19, message: "肥西老母鸡汤真的是家的味道，暖胃。", preference: { items: "肥西老母鸡汤", seat: "四人桌", sweetness: "米饭", time: "中午12点" } },
      { name: "梅菜", avatar: "🐈", visits: 7, message: "梅菜扣肉饭肥而不腻，配汤完美。", preference: { items: "梅菜扣肉饭", seat: "角落", sweetness: "米饭", time: "晚餐" } },
      { name: "蒸蛋", avatar: "🐈‍⬛", visits: 4, message: "农家蒸蛋超级嫩滑，给小孩必点。", preference: { items: "农家蒸蛋", seat: "卡座", sweetness: "无", time: "午餐" } },
    ],
  ];

  // 弹窗控制（绝对定位在小猫头上）
  var popup = document.getElementById("shopPopup");
  var popupBody = document.getElementById("shopPopupBody");
  var catsContainer = document.getElementById("shopCats");
  var currentMode = "visitor"; // "visitor" | "preference"

  function closePopup() {
    if (popup) popup.setAttribute("aria-hidden", "true");
    currentMode = "visitor";
  }

  function positionPopup(targetCat) {
    if (!popup || !catsContainer) return;
    var catRect = targetCat.getBoundingClientRect();
    var containerRect = catsContainer.getBoundingClientRect();

    // 计算小猫在容器内的相对中心位置
    var catCenterX = catRect.left + catRect.width / 2 - containerRect.left;
    var catTop = catRect.top - containerRect.top;

    // 先显示出来才能拿到弹窗尺寸
    popup.setAttribute("aria-hidden", "false");
    var popupRect = popup.getBoundingClientRect();
    var popupW = popupRect.width;
    var popupH = popupRect.height;

    // 水平居中
    var left = catCenterX - popupW / 2;
    // 垂直：默认显示在小猫上方（留出 10px 间距）
    var gap = 10;
    var top = catTop - popupH - gap;

    // 边界检测：上方空间不够则显示在小猫下方
    if (top < 0) {
      top = catTop + catRect.height + gap;
      popup.classList.add("shop-popup--below");
    } else {
      popup.classList.remove("shop-popup--below");
    }

    // 水平边界检测
    var containerW = containerRect.width;
    if (left < 8) left = 8;
    if (left + popupW > containerW - 8) left = containerW - popupW - 8;

    popup.style.left = left + "px";
    popup.style.top = top + "px";
  }

  function renderVisitorPopup(visitor) {
    if (!popupBody) return;
    currentMode = "visitor";
    popupBody.innerHTML =
      '<div class="shop-visitor__header">' +
        '<div class="shop-visitor__avatar">' + escapeHtml(visitor.avatar) + '</div>' +
        '<div class="shop-visitor__meta">' +
          '<div class="shop-visitor__name">' + escapeHtml(visitor.name) + '</div>' +
          '<div class="shop-visitor__visits">最近来过 ' + visitor.visits + ' 次</div>' +
        '</div>' +
      '</div>' +
      '<div class="shop-visitor__message">' + escapeHtml(visitor.message) + '</div>' +
      '<div class="shop-visitor__actions">' +
        '<button class="shop-visitor__btn shop-visitor__btn--pet" id="shopPetBtn">' +
          '<span>🖐</span><span>抚摸</span>' +
        '</button>' +
        '<button class="shop-visitor__btn shop-visitor__btn--feed" id="shopFeedBtn">' +
          '<span>🐟</span><span>投喂</span>' +
        '</button>' +
        '<button class="shop-visitor__btn shop-visitor__btn--primary" id="shopPrefBtn">' +
          '<span>🔖</span><span>查看偏好</span>' +
        '</button>' +
        '<button class="shop-visitor__btn" id="shopMsgBtn">' +
          '<span>✉</span><span>私信留言</span>' +
        '</button>' +
      '</div>';

    var prefBtn = document.getElementById("shopPrefBtn");
    if (prefBtn) {
      prefBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        renderPreferencePopup(visitor);
      });
    }

    var petBtn = document.getElementById("shopPetBtn");
    if (petBtn) {
      petBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        renderPetPopup(visitor);
      });
    }

    var msgBtn = document.getElementById("shopMsgBtn");
    if (msgBtn) {
      msgBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        renderMessagePopup(visitor);
      });
    }

    var feedBtn = document.getElementById("shopFeedBtn");
    if (feedBtn) {
      feedBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        renderFeedPopup(visitor);
      });
    }
  }

  function renderFeedPopup(visitor) {
    if (!popupBody) return;
    currentMode = "feed";
    popupBody.innerHTML =
      '<div class="shop-feed__crunch">' +
        '<div class="shop-feed__crunch-text">咔哧 ~ 咔哧 ~</div>' +
        '<div class="shop-feed__sub">' + escapeHtml(visitor.name) + "吃得很开心，尾巴摇个不停</div>" +
      '</div>' +
      '<button class="shop-feed__back" id="shopFeedBack">返回</button>';

    var backBtn = document.getElementById("shopFeedBack");
    if (backBtn) {
      backBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        renderVisitorPopup(visitor);
      });
    }
  }

  function renderPetPopup(visitor) {
    if (!popupBody) return;
    currentMode = "pet";
    popupBody.innerHTML =
      '<div class="shop-pet__meow">' +
        '<div class="shop-pet__meow-text">喵 ~</div>' +
        '<div class="shop-pet__sub">' + escapeHtml(visitor.name) + "开心地蹭了蹭你的手</div>" +
      '</div>' +
      '<button class="shop-pet__back" id="shopPetBack">返回</button>';

    var backBtn = document.getElementById("shopPetBack");
    if (backBtn) {
      backBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        renderVisitorPopup(visitor);
      });
    }
  }

  function renderMessagePopup(visitor) {
    if (!popupBody) return;
    currentMode = "message";
    popupBody.innerHTML =
      '<div class="shop-message__title">给 ' + escapeHtml(visitor.name) + ' 留言</div>' +
      '<textarea class="shop-message__input" id="shopMsgInput" placeholder="写点什么..." rows="3"></textarea>' +
      '<button class="shop-message__send" id="shopMsgSend">发送</button>' +
      '<button class="shop-message__back" id="shopMsgBack">返回</button>';

    var sendBtn = document.getElementById("shopMsgSend");
    if (sendBtn) {
      sendBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var input = document.getElementById("shopMsgInput");
        var text = input ? input.value.trim() : "";
        if (!text) {
          popupBody.innerHTML =
            '<div class="shop-message__sent">' +
              '<div class="shop-message__sent-icon">✉</div>' +
              '<div class="shop-message__sent-text">请输入内容哦</div>' +
            '</div>' +
            '<button class="shop-message__back" id="shopMsgBack2">返回</button>';
        } else {
          popupBody.innerHTML =
            '<div class="shop-message__sent">' +
              '<div class="shop-message__sent-icon">✓</div>' +
              '<div class="shop-message__sent-text">留言已发送</div>' +
              '<div class="shop-message__sent-sub">「' + escapeHtml(text.substring(0, 30)) + (text.length > 30 ? "..." : "") + '」</div>' +
            '</div>' +
            '<button class="shop-message__back" id="shopMsgBack2">返回</button>';
        }
        var back2 = document.getElementById("shopMsgBack2");
        if (back2) {
          back2.addEventListener("click", function (e) {
            e.stopPropagation();
            renderVisitorPopup(visitor);
          });
        }
      });
    }

    var backBtn = document.getElementById("shopMsgBack");
    if (backBtn) {
      backBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        renderVisitorPopup(visitor);
      });
    }
  }

  function renderPreferencePopup(visitor) {
    if (!popupBody) return;
    currentMode = "preference";
    var p = visitor.preference;
    var items = [
      { icon: "🍽", label: "常点", value: p.items },
      { icon: "🪑", label: "座位偏好", value: p.seat },
      { icon: "🍬", label: "甜度", value: p.sweetness },
      { icon: "⏰", label: "习惯时间", value: p.time },
    ];
    var html = '<div class="shop-preference__title">' + escapeHtml(visitor.name) + "的饮食偏好</div>";
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      html +=
        '<div class="shop-preference__item">' +
          '<div class="shop-preference__icon">' + it.icon + '</div>' +
          '<div>' +
            '<div class="shop-preference__label">' + escapeHtml(it.label) + '</div>' +
            '<div class="shop-preference__value">' + escapeHtml(it.value) + '</div>' +
          '</div>' +
        '</div>';
    }
    html += '<button class="shop-preference__close" id="shopPrefClose">返回</button>';
    popupBody.innerHTML = html;

    var closeBtn = document.getElementById("shopPrefClose");
    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        renderVisitorPopup(visitor);
      });
    }
  }

  function bindCatClicks(container, visitors) {
    if (!container) return;
    container.addEventListener("click", function (e) {
      var cat = e.target.closest(".shop-cat");
      if (!cat) {
        // 点击非小猫区域关闭弹窗
        closePopup();
        return;
      }
      var idx = parseInt(cat.getAttribute("data-visitor-index"), 10);
      if (isNaN(idx) || !visitors[idx]) return;

      // 如果点击的是同一只猫且弹窗已打开，则关闭
      if (popup && popup.getAttribute("aria-hidden") === "false" && cat === currentCat) {
        closePopup();
        currentCat = null;
        return;
      }

      currentCat = cat;
      renderVisitorPopup(visitors[idx]);
      // 用 setTimeout 确保 DOM 渲染后再定位
      setTimeout(function () {
        positionPopup(cat);
      }, 0);
    });

    // 点击页面其他地方关闭弹窗
    document.addEventListener("click", function (e) {
      if (!popup) return;
      if (popup.getAttribute("aria-hidden") === "true") return;
      var clickedCat = e.target.closest(".shop-cat");
      var clickedPopup = e.target.closest(".shop-popup");
      if (!clickedCat && !clickedPopup) {
        closePopup();
        currentCat = null;
      }
    });
  }

  var currentCat = null;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);
