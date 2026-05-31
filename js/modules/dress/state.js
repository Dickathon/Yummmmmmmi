(function (global) {
  "use strict";

  var root = global.Yummi.modules.dress;
  var cfg = root.config;
  var STORAGE_KEY = "yummi_dress_selection";
  var NONE = "";
  var DEFAULT_PET_NAME = "yummy";
  var DEFAULT_CAT_HOUSE = "placeholder";
  var FREE_ITEM_COUNT = 2;
  var ITEM_PRICE = 2;

  var CATEGORY_ORDER = ["头部", "躯干", "四肢", "尾巴", "毯子", "饮品"];

  var ITEM_NAMES = {
    "头部": ["剁椒鱼头", "北京烤鸭", "披萨", "汉堡", "胡辣汤", "臭豆腐", "蒸螃蟹", "螺蛳粉", "酸菜鱼", "鹅肝"],
    "躯干": ["冬阴功汤", "咖喱饭", "大盘鸡", "小鸡炖蘑菇", "火锅", "烧鹅", "牛排", "石锅拌饭", "红烧肉", "羊肉泡馍", "蔬菜沙拉"],
    "四肢": ["小炒黄牛肉", "手抓羊肉", "春卷", "海蛎煎", "炸鸡", "糖醋排骨", "肠粉", "薯条", "锅包肉", "麻辣小龙虾"],
    "尾巴": ["九转大肠", "兰州拉面", "刀削面", "刺身", "回锅肉", "炒腊肉", "炸酱面", "烤串", "瓦罐汤", "酸辣粉"],
    "毯子": ["固体杨枝甘露", "奶油蛋糕", "榴莲制品", "水果捞", "焦糖布丁", "芒果冰沙", "芝士奶酪块", "葡式蛋挞", "话梅", "酸嘢", "香草冰淇淋", "黄油曲奇", "黑巧克力"],
    "饮品": ["冰红茶", "珍珠奶茶", "冰镇酸梅汤", "青岛啤酒", "鸡尾酒", "抹茶奶茶", "美式咖啡", "龙井茶", "姜糖水", "碳酸", "酸奶", "牛奶"]
  };

  var SHOP_BACKGROUNDS = [
    { id: "starbucks", name: "星巴克", src: "source/svgSHOP/interior_starbucks.svg" },
    { id: "mcdonalds", name: "麦当劳", src: "source/svgSHOP/interior_mcdonalds.svg" },
    { id: "heytea", name: "喜茶", src: "source/svgSHOP/interior_heytea.svg" },
    { id: "kfc", name: "肯德基", src: "source/svgSHOP/interior_kfc.svg" },
    { id: "haidilao", name: "海底捞", src: "source/svgSHOP/interior_haidilao.svg" },
    { id: "mixue", name: "蜜雪冰城", src: "source/svgSHOP/interior_mixue.svg" },
    { id: "luckin", name: "瑞幸咖啡", src: "source/svgSHOP/interior_luckin.svg" },
    { id: "burgerking", name: "汉堡王", src: "source/svgSHOP/interior_burgerking.svg" },
    { id: "chapanda", name: "茶百道", src: "source/svgSHOP/interior_chapanda.svg" },
    { id: "pizzahut", name: "必胜客", src: "source/svgSHOP/interior_pizzahut.svg" },
    { id: "nayuki", name: "奈雪的茶", src: "source/svgSHOP/interior_nayuki.svg" },
    { id: "subway", name: "赛百味", src: "source/svgSHOP/interior_subway.svg" },
    { id: "alittle_tea", name: "一点点", src: "source/svgSHOP/interior_alittle_tea.svg" },
    { id: "auntea", name: "沪上阿姨", src: "source/svgSHOP/interior_auntea.svg" },
    { id: "goodme", name: "古茗", src: "source/svgSHOP/interior_goodme.svg" },
    { id: "laoxiangji", name: "老乡鸡", src: "source/svgSHOP/interior_laoxiangji.svg" }
  ];

  var CAT_HOUSES = [
    { id: DEFAULT_CAT_HOUSE, name: "占位猫屋", type: "placeholder" }
  ];

  var BASE_LAYERS = {
    blanket: cfg.petBaseBase + "blanket_1254.png",
    tail: cfg.petBaseBase + "tail_1254.png",
    body: cfg.petBaseBase + "body_1254.png",
    legs: cfg.petBaseBase + "legs_1254.png",
    head: cfg.petBaseBase + "head_1254.png"
  };

  var layerClassByCategory = {
    "毯子": "blanket",
    "四肢": "legs",
    "尾巴": "tail",
    "躯干": "body",
    "头部": "head"
  };

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function makeSet(names) {
    var set = {};
    var i;
    for (i = 0; i < names.length; i += 1) {
      set[names[i]] = true;
    }
    return set;
  }

  function findById(list, id) {
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].id === id) {
        return list[i];
      }
    }
    return null;
  }

  function normalizePetName(raw) {
    var value = typeof raw === "string" ? raw : DEFAULT_PET_NAME;
    value = value.replace(/的哈基米$/, "").trim();
    if (!value) value = DEFAULT_PET_NAME;
    return value.slice(0, 14);
  }

  function sharePetName(raw) {
    var value = normalizePetName(raw);
    if (value.toLowerCase() === DEFAULT_PET_NAME) {
      return "YUMMY";
    }
    return value;
  }

  function normalizeBackgroundId(raw) {
    return raw && findById(SHOP_BACKGROUNDS, raw) ? raw : NONE;
  }

  function normalizeCatHouseId(raw) {
    return raw && findById(CAT_HOUSES, raw) ? raw : DEFAULT_CAT_HOUSE;
  }

  function optionListWithActive(list, activeId) {
    return list.map(function (entry) {
      return Object.assign({}, entry, {
        active: entry.id === activeId
      });
    });
  }

  function pathFor(category, name) {
    if (!name) return "";
    if (category === "饮品") {
      return cfg.drinkBase + name + "-10kb.webp";
    }
    return cfg.petLayersBase + category + "/" + name + "-" + category + ".png";
  }

  function item(category, name) {
    return {
      category: category,
      name: name,
      src: pathFor(category, name)
    };
  }

  function catalogFor(category) {
    var names = ITEM_NAMES[category] || [];
    var list = [];
    var i;
    for (i = 0; i < names.length; i += 1) {
      list.push(item(category, names[i]));
    }
    return list;
  }

  function catalogMap() {
    var map = {};
    CATEGORY_ORDER.forEach(function (category) {
      map[category] = catalogFor(category);
    });
    return map;
  }

  function findItem(category, name) {
    var list = catalogFor(category);
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].name === name) {
        return list[i];
      }
    }
    return null;
  }

  function normalizeUnlocked(raw) {
    var out = {};
    CATEGORY_ORDER.forEach(function (category) {
      var known = makeSet(ITEM_NAMES[category] || []);
      var list = raw && Array.isArray(raw[category]) ? raw[category] : [];
      out[category] = list.filter(function (name, index) {
        return known[name] && list.indexOf(name) === index;
      });
    });
    return out;
  }

  function normalizeSelected(raw) {
    var out = {};
    CATEGORY_ORDER.forEach(function (category) {
      if (!raw || !hasOwn(raw, category)) return;
      if (raw[category] === NONE || findItem(category, raw[category])) {
        out[category] = raw[category];
      }
    });
    return out;
  }

  function loadStored() {
    var fallback = {
      selected: {},
      unlocked: {},
      petName: DEFAULT_PET_NAME,
      backgroundId: NONE,
      catHouseId: DEFAULT_CAT_HOUSE
    };
    var parsed;

    try {
      if (typeof localStorage === "undefined") return fallback;
      parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      parsed = {};
    }

    return {
      selected: normalizeSelected(parsed.selected),
      unlocked: normalizeUnlocked(parsed.unlocked),
      petName: normalizePetName(parsed.petName),
      backgroundId: normalizeBackgroundId(parsed.backgroundId),
      catHouseId: normalizeCatHouseId(parsed.catHouseId)
    };
  }

  function saveStored(state) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        selected: state.selected,
        unlocked: state.unlocked,
        petName: normalizePetName(state.petName),
        backgroundId: normalizeBackgroundId(state.backgroundId),
        catHouseId: normalizeCatHouseId(state.catHouseId)
      }));
    } catch (e) {
      /* storage may be unavailable */
    }
  }

  function currentFor(category, state) {
    if (hasOwn(state.selected, category)) {
      return state.selected[category];
    }
    return NONE;
  }

  function isDefaultOwned(category, name) {
    var names = ITEM_NAMES[category] || [];
    var index = names.indexOf(name);
    return index > -1 && index < FREE_ITEM_COUNT;
  }

  function isOwned(category, name, state) {
    if (!name) return true;
    return (
      currentFor(category, state) === name ||
      isDefaultOwned(category, name) ||
      (state.unlocked[category] || []).indexOf(name) !== -1
    );
  }

  function unlockItem(state, category, name) {
    if (!name || isDefaultOwned(category, name)) return;
    state.unlocked[category] = state.unlocked[category] || [];
    if (state.unlocked[category].indexOf(name) === -1) {
      state.unlocked[category].unshift(name);
    }
  }

  function setSelection(state, category, name) {
    state.selected[category] = name || NONE;
    saveStored(state);
    return sync(state);
  }

  function sortedItems(category, state) {
    var current = currentFor(category, state);
    var entries = catalogFor(category).map(function (entry, index) {
      var active = current === entry.name;
      var owned = isOwned(category, entry.name, state);
      var status = active ? "wearing" : (owned ? "owned" : "locked");

      return Object.assign({}, entry, {
        active: active,
        owned: owned,
        locked: !owned,
        status: status,
        price: owned ? 0 : ITEM_PRICE,
        rank: active ? 0 : (owned ? 1 : 2),
        order: index
      });
    });

    entries.push({
      category: category,
      name: NONE,
      label: "不使用装扮",
      src: "",
      active: current === NONE,
      owned: true,
      locked: false,
      status: current === NONE ? "wearing" : "owned",
      price: 0,
      rank: current === NONE ? 0 : 1,
      order: -1
    });

    entries.sort(function (a, b) {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.order - b.order;
    });

    return entries;
  }

  function layer(src, label, className, zClass) {
    return {
      src: src,
      label: label,
      className: className,
      zClass: zClass || className
    };
  }

  function selectedItem(category, state) {
    var current = currentFor(category, state);
    return current ? findItem(category, current) : null;
  }

  function computeLayers(state) {
    var blanket = selectedItem("毯子", state);
    var legs = selectedItem("四肢", state);
    var tail = selectedItem("尾巴", state);
    var body = selectedItem("躯干", state);
    var head = selectedItem("头部", state);
    var layers = [];

    layers.push(layer(blanket ? blanket.src : BASE_LAYERS.blanket, blanket ? blanket.name + "毯子" : "基础毯子", "blanket", "blanket"));
    layers.push(layer(BASE_LAYERS.legs, "基础四肢", "legs-base", "legs"));
    if (legs) layers.push(layer(legs.src, legs.name + "四肢", "legs-decor", "legs"));
    layers.push(layer(tail ? tail.src : BASE_LAYERS.tail, tail ? tail.name + "尾巴" : "基础尾巴", "tail", "tail"));
    layers.push(layer(BASE_LAYERS.body, "基础躯干", "body-base", "body"));
    if (body) layers.push(layer(body.src, body.name + "躯干", "body-decor", "body"));
    layers.push(layer(head ? head.src : BASE_LAYERS.head, head ? head.name + "头部" : "基础头部", "head", "head"));

    return layers;
  }

  function computeDrink(state) {
    var drink = selectedItem("饮品", state);
    return drink ? {
      name: drink.name,
      src: drink.src
    } : null;
  }

  function cloneLayerList(layers) {
    return (layers || []).map(function (layer) {
      return Object.assign({}, layer);
    });
  }

  function captureSnapshot(state) {
    if (!sharedState) {
      sharedState = createState();
    }

    var target = sync(state || sharedState);

    return {
      petName: target.petName,
      petDisplayName: target.petDisplayName,
      backgroundId: target.backgroundId,
      catHouseId: target.catHouseId,
      activeBackground: target.activeBackground ? Object.assign({}, target.activeBackground) : null,
      activeCatHouse: target.activeCatHouse ? Object.assign({}, target.activeCatHouse) : null,
      layers: cloneLayerList(target.layers),
      drink: target.drink ? Object.assign({}, target.drink) : null,
      selected: Object.assign({}, target.selected),
      unlocked: Object.keys(target.unlocked || {}).reduce(function (memo, key) {
        memo[key] = (target.unlocked[key] || []).slice();
        return memo;
      }, {})
    };
  }

  function normalizeShareSelected(selected) {
    var out = {};

    CATEGORY_ORDER.forEach(function (category) {
      var value = selected && hasOwn(selected, category) ? selected[category] : NONE;
      out[category] = value === NONE || findItem(category, value) ? value : NONE;
    });

    return out;
  }

  function createShareState(raw) {
    return sync({
      phase: "ready",
      storageKey: STORAGE_KEY,
      categoryOrder: CATEGORY_ORDER.slice(),
      catalog: catalogMap(),
      selected: normalizeShareSelected(raw && raw.selected),
      unlocked: normalizeUnlocked(raw && raw.unlocked),
      petName: normalizePetName(raw && raw.petName),
      petDisplayName: "",
      backgroundId: NONE,
      catHouseId: DEFAULT_CAT_HOUSE,
      activeBackground: null,
      activeCatHouse: null,
      backgrounds: [],
      catHouses: [],
      foodSelectionNames: [],
      foodSelectionSet: {},
      layers: [],
      drink: null,
      wardrobe: []
    });
  }

  function getSelectionForShareIndex(category, index) {
    var list = ITEM_NAMES[category] || [];
    var n = Number(index);

    if (!isFinite(n) || n < 0 || n >= list.length) {
      return NONE;
    }

    return list[Math.floor(n)] || NONE;
  }

  function getShareIndexForSelection(category, name) {
    var list = ITEM_NAMES[category] || [];
    var value = name == null ? NONE : String(name);

    if (!value) {
      return -1;
    }

    return list.indexOf(value);
  }

  function getFoodsFromShareSelection(selected) {
    var normalized = normalizeShareSelected(selected);
    var foods = [];

    CATEGORY_ORDER.forEach(function (category) {
      var name = normalized[category];
      if (name && foods.indexOf(name) === -1) {
        foods.push(name);
      }
    });

    return foods;
  }

  function buildSharedAppearance(raw) {
    var snapshot = createShareState(raw || {});
    return {
      petName: sharePetName(snapshot.petName),
      petDisplayName: sharePetName(snapshot.petName) + "的哈基米",
      layers: cloneLayerList(snapshot.layers),
      drink: snapshot.drink ? Object.assign({}, snapshot.drink) : null,
      selected: Object.assign({}, snapshot.selected)
    };
  }

  function buildShareAppearance() {
    var snapshot = captureSnapshot();
    return {
      petName: sharePetName(snapshot.petName),
      petDisplayName: sharePetName(snapshot.petName) + "的哈基米",
      selected: normalizeShareSelected(snapshot.selected),
      layers: cloneLayerList(snapshot.layers),
      drink: snapshot.drink ? Object.assign({}, snapshot.drink) : null
    };
  }

  function resetAll(state) {
    if (!sharedState) {
      sharedState = createState();
    }

    var target = state || sharedState;

    if (!target) {
      return null;
    }

    target.selected = {};
    target.unlocked = {};
    target.petName = DEFAULT_PET_NAME;
    target.backgroundId = NONE;
    target.catHouseId = DEFAULT_CAT_HOUSE;
    saveStored(target);
    return sync(target);
  }

  function sync(state) {
    state.phase = "ready";
    state.petName = normalizePetName(state.petName);
    state.petDisplayName = state.petName + "的哈基米";
    state.backgroundId = normalizeBackgroundId(state.backgroundId);
    state.catHouseId = normalizeCatHouseId(state.catHouseId);
    state.foodSelectionNames = [];
    state.foodSelectionSet = {};
    state.layers = computeLayers(state);
    state.drink = computeDrink(state);
    state.activeBackground = findById(SHOP_BACKGROUNDS, state.backgroundId);
    state.activeCatHouse = findById(CAT_HOUSES, state.catHouseId);
    state.backgrounds = optionListWithActive(SHOP_BACKGROUNDS, state.backgroundId);
    state.catHouses = optionListWithActive(CAT_HOUSES, state.catHouseId);
    state.wardrobe = CATEGORY_ORDER.map(function (category) {
      return {
        category: category,
        current: currentFor(category, state),
        items: sortedItems(category, state)
      };
    });
    return state;
  }

  function createState() {
    var stored = loadStored();
    return sync({
      phase: "ready",
      storageKey: STORAGE_KEY,
      categoryOrder: CATEGORY_ORDER.slice(),
      catalog: catalogMap(),
      selected: stored.selected,
      unlocked: stored.unlocked,
      petName: stored.petName,
      petDisplayName: "",
      backgroundId: stored.backgroundId,
      catHouseId: stored.catHouseId,
      activeBackground: null,
      activeCatHouse: null,
      backgrounds: [],
      catHouses: [],
      foodSelectionNames: [],
      foodSelectionSet: {},
      layers: [],
      drink: null,
      wardrobe: []
    });
  }

  var sharedState = null;

  root.state = {
    create: function () {
      if (!sharedState) {
        sharedState = createState();
      }
      return sync(sharedState);
    },
    sync: sync,
    captureSnapshot: captureSnapshot,
    select: function (state, category, name) {
      var target = state || sharedState;
      if (!target || CATEGORY_ORDER.indexOf(category) === -1) return null;
      if (name && !findItem(category, name)) return sync(target);
      if (name && !isOwned(category, name, target)) return sync(target);

      return setSelection(target, category, name);
    },
    purchaseAndSelect: function (state, category, name) {
      var target = state || sharedState;
      var wallet = global.Yummi && global.Yummi.fishCoins;

      if (!target || CATEGORY_ORDER.indexOf(category) === -1 || !name || !findItem(category, name)) {
        return { ok: false, reason: "invalid", price: ITEM_PRICE, state: target ? sync(target) : null };
      }

      if (isOwned(category, name, target)) {
        return { ok: true, purchased: false, price: 0, state: setSelection(target, category, name) };
      }

      if (!wallet || typeof wallet.spend !== "function") {
        return { ok: false, reason: "wallet_unavailable", price: ITEM_PRICE, state: sync(target) };
      }

      if (!wallet.spend(ITEM_PRICE)) {
        return { ok: false, reason: "insufficient_fish", price: ITEM_PRICE, state: sync(target) };
      }

      unlockItem(target, category, name);
      return { ok: true, purchased: true, price: ITEM_PRICE, state: setSelection(target, category, name) };
    },
    setPetName: function (state, name) {
      var target = state || sharedState;
      if (!target) return null;
      target.petName = normalizePetName(name);
      saveStored(target);
      return sync(target);
    },
    selectBackground: function (state, id) {
      var target = state || sharedState;
      if (!target) return null;
      if (id && !findById(SHOP_BACKGROUNDS, id)) return sync(target);
      target.backgroundId = id || NONE;
      saveStored(target);
      return sync(target);
    },
    selectCatHouse: function (state, id) {
      var target = state || sharedState;
      if (!target) return null;
      if (!findById(CAT_HOUSES, id)) return sync(target);
      target.catHouseId = id;
      saveStored(target);
      return sync(target);
    },
    resetAll: resetAll,
    buildShareAppearance: buildShareAppearance,
    buildSharedAppearance: buildSharedAppearance,
    getFoodsFromShareSelection: getFoodsFromShareSelection,
    getSelectionForShareIndex: getSelectionForShareIndex,
    getShareIndexForSelection: getShareIndexForSelection,
    getCategoryOrder: function () {
      return CATEGORY_ORDER.slice();
    },
    getSharePetName: sharePetName,
    reset: function (state) {
      if (!state) return;
      state.phase = "idle";
    },
    noneValue: NONE,
    itemPrice: ITEM_PRICE
  };
})(typeof window !== "undefined" ? window : this);
