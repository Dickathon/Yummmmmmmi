(function (global) {
  "use strict";

  var root = global.Yummi.modules.order;

  function resolveItemUrls(relativePaths) {
    var base = (root.config && root.config.itemsBase) || "";
    return relativePaths.map(function (path) {
      return base + path;
    });
  }

  function resolveDiscItemPaths(cfg) {
    var catalog;
    var key;
    var paths;
    var poolSize;

    if (cfg.items && cfg.items.length) {
      paths = cfg.items.slice();
    } else {
      catalog = root.itemsCatalog;
      key = cfg.catalogKey;
      paths = catalog && key && catalog[key] ? catalog[key].slice() : [];
    }

    poolSize = root.config && root.config.poolSizePerDisc;
    if (!poolSize || poolSize >= paths.length) {
      return paths;
    }

    return subsamplePaths(paths, poolSize);
  }

  /** 从目录随机抽 N 条，使三层池子等大 */
  function subsamplePaths(paths, count) {
    var copy = paths.slice();
    var i;
    var j;
    var tmp;

    for (i = copy.length - 1; i > 0; i -= 1) {
      j = Math.floor(Math.random() * (i + 1));
      tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }

    return copy.slice(0, count);
  }

  function getTargetPoolSize() {
    return (root.config && root.config.poolSizePerDisc) || 15;
  }

  /** 各格在 playOrder 上错开，避免同盘多格同时撞到同一道菜 */
  function getSlotDeckOffset(slotIndex, poolSize, sectorCount) {
    var step = Math.max(1, Math.floor(poolSize / sectorCount));
    return (slotIndex * step) % poolSize;
  }

  function getOrderIndexAt(disc, slot, cursor) {
    var order = disc.playOrder;
    var n = order ? order.length : 0;
    var offset = slot.deckOffset || 0;

    if (!n) {
      return 0;
    }

    return Number(order[(cursor + offset) % n]);
  }

  /** Fisher–Yates：返回 0..count-1 的一次随机排列，每盘启动时各洗牌一次 */
  function createShuffledPlayOrder(count, avoidIndex) {
    var order = [];
    var i;
    var j;
    var tmp;
    var guard;

    for (i = 0; i < count; i += 1) {
      order.push(i);
    }

    for (i = count - 1; i > 0; i -= 1) {
      j = Math.floor(Math.random() * (i + 1));
      tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }

    if (count <= 1 || avoidIndex === undefined || avoidIndex === null || isNaN(avoidIndex)) {
      return order;
    }

    guard = 0;
    while (Number(order[0]) === Number(avoidIndex) && guard < 12) {
      j = Math.floor(Math.random() * count);
      tmp = order[0];
      order[0] = order[j];
      order[j] = tmp;
      guard += 1;
    }

    return order;
  }

  /**
   * 沿 playOrder 前进一格；整圈后重新洗牌且队首 ≠ leavingIndex。
   * leavingIndex 为刚下场的菜（换菜前的 index），保证首尾不重复。
   */
  function isFoodIndexTakenOnDisc(disc, slot, idx) {
    var slots = disc.sectorSlots;
    var i;
    var other;

    if (!slots || slots.length < 2) {
      return false;
    }

    for (i = 0; i < slots.length; i += 1) {
      other = slots[i];
      if (!other || other === slot) {
        continue;
      }
      if (Number(other.imageIndex) === Number(idx)) {
        return true;
      }
    }

    return false;
  }

  function pickNextFoodIndex(disc, slot, leavingIndex) {
    var order = disc.playOrder;
    var n = order ? order.length : 0;
    var prevCursor;
    var cursor;
    var idx;
    var current;
    var guard;

    if (!n) {
      return 0;
    }

    if (n === 1) {
      return Number(order[0]);
    }

    current = Number(leavingIndex);
    if (isNaN(current)) {
      current = Number(slot.imageIndex);
    }

    cursor = typeof slot.deckCursor === "number" ? slot.deckCursor : 0;
    prevCursor = cursor;
    cursor = (cursor + 1) % n;

    if (cursor === 0 && prevCursor === n - 1) {
      disc.playOrder = createShuffledPlayOrder(n, current);
      order = disc.playOrder;
      slot.roundsCompleted = (slot.roundsCompleted || 0) + 1;
    }

    idx = getOrderIndexAt(disc, slot, cursor);
    guard = 0;

    while ((idx === current || isFoodIndexTakenOnDisc(disc, slot, idx)) && guard < n) {
      cursor = (cursor + 1) % n;
      idx = getOrderIndexAt(disc, slot, cursor);
      guard += 1;
    }

    if (idx === current || isFoodIndexTakenOnDisc(disc, slot, idx)) {
      disc.playOrder = createShuffledPlayOrder(n, current);
      order = disc.playOrder;
      cursor = 0;
      idx = getOrderIndexAt(disc, slot, cursor);
      guard = 0;
      while ((idx === current || isFoodIndexTakenOnDisc(disc, slot, idx)) && guard < n) {
        cursor = (cursor + 1) % n;
        idx = getOrderIndexAt(disc, slot, cursor);
        guard += 1;
      }
    }

    slot.deckCursor = cursor;
    slot.playOrderLength = n;
    return idx;
  }

  /** centerAngle 与 view 格心绑定；槽位随盘面公转，牌身始终朝屏幕上方 */
  function createSectorSlots(sectorCount, disc) {
    var step = 360 / sectorCount;
    var order = disc.playOrder || [];
    var slots = [];
    var i;
    var imageIndex;
    var cursor;

    for (i = 0; i < sectorCount; i += 1) {
      var offset = getSlotDeckOffset(i, order.length, sectorCount);

      cursor = 0;
      imageIndex = order.length ? Number(order[(cursor + offset) % order.length]) : i;
      slots.push({
        index: i,
        centerAngle: i * step + step / 2,
        imageIndex: imageIndex,
        deckCursor: cursor,
        deckOffset: offset,
        playOrderLength: order.length,
        roundsCompleted: 0,
        swapArmed: true,
        swapGeneration: 0
      });
    }

    return slots;
  }

  function applyDiscItems(disc) {
    var cfg = root.config && root.config.discs && root.config.discs[disc.id];
    var itemCount;

    var relativePaths = cfg ? resolveDiscItemPaths(cfg) : [];

    if (!cfg || !relativePaths.length) {
      disc.itemUrls = [];
      disc.itemSize = 0;
      disc.placardDrop = 0;
      disc.playOrder = [];
      disc.sectorSlots = [];
      return;
    }

    var sectorCount = (root.config && root.config.sectorCount) || disc.sectorColors.length;

    itemCount = relativePaths.length;
    disc.itemSize = cfg.itemSize || 24;
    disc.placardDrop = cfg.placardDrop || 0;
    disc.itemUrls = resolveItemUrls(relativePaths);
    disc.playOrder = createShuffledPlayOrder(itemCount);
    disc.sectorSlots = createSectorSlots(sectorCount, disc);
  }

  function createDiscs() {
    var discs = [
      {
        id: "base",
        label: "底盘",
        cx: 190,
        cy: 286,
        rx: 150,
        ry: 38,
        height: 64,
        angle: 8,
        autoSpeed: 8,
        hitInnerRadius: 116,
        sectorInnerRadius: 36,
        dragging: false,
        pointerId: null,
        lastPointerAngle: null,
        topColor: "#f5f0e8",
        capColor: "#e8dfd1",
        sideGradientId: "order-base-side",
        sectorColors: ["#f5f0e8", "#f0e7d9", "#e8dfd1", "#f3ebe0", "#c4a882", "#efe3d4"]
      },
      {
        id: "mid",
        label: "中盘",
        cx: 190,
        cy: 212,
        rx: 108,
        ry: 28,
        height: 54,
        angle: 24,
        autoSpeed: 12,
        hitInnerRadius: 78,
        sectorInnerRadius: 28,
        dragging: false,
        pointerId: null,
        lastPointerAngle: null,
        topColor: "#f4e1e1",
        capColor: "#f7eeee",
        sideGradientId: "order-mid-side",
        sectorColors: ["#f4e1e1", "#f9efef", "#f1d7d7", "#ead1d1", "#e8dfd1", "#f8f3f1"]
      },
      {
        id: "top",
        label: "顶盘",
        cx: 190,
        cy: 148,
        rx: 72,
        ry: 19,
        height: 42,
        angle: 48,
        autoSpeed: 16,
        hitInnerRadius: 0,
        sectorInnerRadius: 20,
        dragging: false,
        pointerId: null,
        lastPointerAngle: null,
        topColor: "#8fbc8f",
        capColor: "#e8dfd1",
        sideGradientId: "order-top-side",
        sectorColors: ["#8fbc8f", "#a7c7a3", "#dfe9d8", "#c9dbbf", "#9caf88", "#b7d0aa"]
      }
    ];

    discs.forEach(applyDiscItems);
    return discs;
  }

  root.state = {
    pickNextFoodIndex: pickNextFoodIndex,
    create: function () {
      return {
        phase: "idle",
        equipped: [],
        discs: createDiscs(),
        activeDiscId: null,
        activePointerId: null,
        lastTick: 0
      };
    },
    reset: function (state) {
      if (!state) return;
      state.phase = "idle";
      state.equipped = [];
      state.discs = createDiscs();
      state.activeDiscId = null;
      state.activePointerId = null;
      state.lastTick = 0;
    }
  };
})(typeof window !== "undefined" ? window : this);
