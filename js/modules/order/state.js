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

  function cloneTurntableGlobal() {
    var src = root.config && root.config.turntable && root.config.turntable.global;
    return src ? Object.assign({}, src) : {};
  }

  function createDiscs() {
    var layout = (root.config && root.config.turntable && root.config.turntable.discLayout) || {};
    var bases = [
      {
        id: "base",
        label: "底盘",
        colorClass: "base",
        baseCx: 190,
        baseCy: 286,
        baseRx: 150,
        baseRy: 38,
        angle: 8,
        autoSpeed: 8,
        hitInnerRadius: 116,
        sectorInnerRadius: 36,
        dragging: false,
        pointerId: null,
        lastPointerAngle: null,
        lastMoveTime: null,
        angularVelocity: 0,
        inertiaBoost: 1,
        topColor: "#f5f0e8",
        capColor: "#e8dfd1",
        sideGradientId: "order-base-side",
        sectorColors: ["#f5f0e8", "#f0e7d9", "#e8dfd1", "#f3ebe0", "#c4a882", "#efe3d4"]
      },
      {
        id: "mid",
        label: "中盘",
        colorClass: "mid",
        baseCx: 190,
        baseCy: 212,
        baseRx: 108,
        baseRy: 28,
        angle: 24,
        autoSpeed: -12,
        hitInnerRadius: 78,
        sectorInnerRadius: 28,
        dragging: false,
        pointerId: null,
        lastPointerAngle: null,
        lastMoveTime: null,
        angularVelocity: 0,
        inertiaBoost: 1,
        topColor: "#f4e1e1",
        capColor: "#f7eeee",
        sideGradientId: "order-mid-side",
        sectorColors: ["#f4e1e1", "#f9efef", "#f1d7d7", "#ead1d1", "#e8dfd1", "#f8f3f1"]
      },
      {
        id: "top",
        label: "顶盘",
        colorClass: "top",
        baseCx: 190,
        baseCy: 148,
        baseRx: 72,
        baseRy: 19,
        angle: 48,
        autoSpeed: -16,
        hitInnerRadius: 0,
        sectorInnerRadius: 20,
        dragging: false,
        pointerId: null,
        lastPointerAngle: null,
        lastMoveTime: null,
        angularVelocity: 0,
        inertiaBoost: 1,
        topColor: "#8fbc8f",
        capColor: "#e8dfd1",
        sideGradientId: "order-top-side",
        sectorColors: ["#8fbc8f", "#a7c7a3", "#dfe9d8", "#c9dbbf", "#9caf88", "#b7d0aa"]
      },
      {
        id: "cap",
        label: "顶柱",
        colorClass: "cap",
        baseCx: 190,
        baseCy: 102,
        baseRx: 48,
        baseRy: 13,
        angle: 0,
        autoSpeed: -18,
        hitInnerRadius: 0,
        sectorInnerRadius: 0,
        dragging: false,
        pointerId: null,
        lastPointerAngle: null,
        lastMoveTime: null,
        angularVelocity: 0,
        inertiaBoost: 0.92,
        topColor: "#f0caa7",
        capColor: "#fff1df",
        sideGradientId: "order-cap-side",
        sectorColors: [],
        itemUrls: [],
        sectorSlots: []
      }
    ];
    var discs = bases.map(function (disc) {
      var patch = layout[disc.id] || {};
      return Object.assign({}, disc, {
        x: patch.x || 0,
        y: patch.y || 0,
        scale: patch.scale != null ? patch.scale : 1,
        heightScale: patch.heightScale != null ? patch.heightScale : 1
      });
    });

    discs.forEach(function (disc) {
      if (disc.id === "cap") {
        return;
      }
      applyDiscItems(disc);
    });

    return discs;
  }

  root.state = {
    pickNextFoodIndex: pickNextFoodIndex,
    create: function () {
      return {
        phase: "idle",
        equipped: [],
        global: cloneTurntableGlobal(),
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
      state.global = cloneTurntableGlobal();
      state.discs = createDiscs();
      state.activeDiscId = null;
      state.activePointerId = null;
      state.lastTick = 0;
    }
  };
})(typeof window !== "undefined" ? window : this);
