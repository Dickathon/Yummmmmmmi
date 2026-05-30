(function (global) {
  "use strict";

  var util = global.Yummi.util;
  var root = global.Yummi.modules.dress;
  var runtime = null;
  var imageSizeCache = {};
  var VIEWBOX_WIDTH = 380;
  var VIEWBOX_HEIGHT = 398;
  var DISC_IDS = ["base", "mid", "top"];
  var CELL_RADIUS_RATIO = 0.58;

  function escapeAttr(text) {
    return util.escapeHtml(text).replace(/"/g, "&quot;");
  }

  function getItemSrc(disc, slotIndex) {
    if (!disc.itemUrls || !disc.itemUrls[slotIndex]) return "";
    return disc.itemUrls[slotIndex];
  }

  function getSlotKey(discId, slotIndex) {
    return discId + "-" + slotIndex;
  }

  function getSectorRadii(disc) {
    return {
      outer: disc.rx - 6,
      inner: disc.sectorInnerRadius
    };
  }

  function degToRad(angle) {
    return (angle - 90) * Math.PI / 180;
  }

  function polarToCartesian(radius, angle) {
    var rad = degToRad(angle);
    return {
      x: radius * Math.cos(rad),
      y: radius * Math.sin(rad)
    };
  }

  function formatNumber(value) {
    return Number(value.toFixed(2));
  }

  function normalizeAngle(angle) {
    var next = angle % 360;
    return next < 0 ? next + 360 : next;
  }

  function angleDelta(nextAngle, prevAngle) {
    var delta = nextAngle - prevAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return delta;
  }

  function findDisc(state, discId) {
    return state.discs.find(function (disc) {
      return disc.id === discId;
    }) || null;
  }

  function createCirclePath(radius) {
    return [
      "M", formatNumber(radius), 0,
      "A", formatNumber(radius), formatNumber(radius), 0, 1, 0, formatNumber(-radius), 0,
      "A", formatNumber(radius), formatNumber(radius), 0, 1, 0, formatNumber(radius), 0,
      "Z"
    ].join(" ");
  }

  function createRingPath(outerRadius, innerRadius) {
    if (!innerRadius || innerRadius <= 0) {
      return createCirclePath(outerRadius);
    }
    return createCirclePath(outerRadius) + " " + createCirclePath(innerRadius);
  }

  function createSidePath(disc) {
    var left = disc.cx - disc.rx;
    var right = disc.cx + disc.rx;
    var top = disc.cy;
    var bottom = disc.cy + disc.height;

    return [
      "M", formatNumber(left), formatNumber(top),
      "L", formatNumber(left), formatNumber(bottom),
      "A", formatNumber(disc.rx), formatNumber(disc.ry), 0, 0, 0, formatNumber(right), formatNumber(bottom),
      "L", formatNumber(right), formatNumber(top),
      "A", formatNumber(disc.rx), formatNumber(disc.ry), 0, 0, 1, formatNumber(left), formatNumber(top),
      "Z"
    ].join(" ");
  }

  function createSideOutlinePath(disc) {
    var left = disc.cx - disc.rx;
    var right = disc.cx + disc.rx;
    var top = disc.cy;
    var bottom = disc.cy + disc.height;

    return [
      "M", formatNumber(left), formatNumber(top),
      "L", formatNumber(left), formatNumber(bottom),
      "A", formatNumber(disc.rx), formatNumber(disc.ry), 0, 0, 0, formatNumber(right), formatNumber(bottom),
      "L", formatNumber(right), formatNumber(top)
    ].join(" ");
  }

  function createDonutSectorPath(innerRadius, outerRadius, startAngle, endAngle) {
    var startOuter = polarToCartesian(outerRadius, startAngle);
    var endOuter = polarToCartesian(outerRadius, endAngle);
    var startInner = polarToCartesian(innerRadius, endAngle);
    var endInner = polarToCartesian(innerRadius, startAngle);
    var largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return [
      "M", formatNumber(startOuter.x), formatNumber(startOuter.y),
      "A", formatNumber(outerRadius), formatNumber(outerRadius), 0, largeArc, 1, formatNumber(endOuter.x), formatNumber(endOuter.y),
      "L", formatNumber(startInner.x), formatNumber(startInner.y),
      "A", formatNumber(innerRadius), formatNumber(innerRadius), 0, largeArc, 0, formatNumber(endInner.x), formatNumber(endInner.y),
      "Z"
    ].join(" ");
  }

  function renderSectorMarkup(disc) {
    var radii = getSectorRadii(disc);
    var outerRadius = radii.outer;
    var innerRadius = radii.inner;
    var sectorCount = disc.sectorColors.length;
    var step = 360 / sectorCount;
    var markup = [];
    var i;

    for (i = 0; i < sectorCount; i += 1) {
      var start = i * step;
      var end = start + step;
      markup.push(
        '<path d="' + createDonutSectorPath(innerRadius, outerRadius, start, end) + '"' +
          ' fill="' + disc.sectorColors[i] + '"' +
          ' stroke="#5c4b3a" stroke-opacity="0.12" stroke-width="1"></path>'
      );
    }

    markup.push('<g class="dress-disc__cells">');
    for (i = 0; i < sectorCount; i += 1) {
      var cellStart = i * step;
      var cellEnd = cellStart + step;
      markup.push(
        '<path class="dress-disc__cell" data-dress-cell="' + disc.id + "-" + i + '"' +
          ' d="' + createDonutSectorPath(innerRadius + 3, outerRadius - 5, cellStart, cellEnd) + '"></path>'
      );
    }
    markup.push("</g>");

    for (i = 0; i < sectorCount; i += 1) {
      var tickOuter = polarToCartesian(outerRadius - 1, i * step);
      var tickInner = polarToCartesian(innerRadius + 6, i * step);
      markup.push(
        '<line x1="' + formatNumber(tickInner.x) + '" y1="' + formatNumber(tickInner.y) +
        '" x2="' + formatNumber(tickOuter.x) + '" y2="' + formatNumber(tickOuter.y) +
        '" stroke="#5c4b3a" stroke-opacity="0.46" stroke-width="1.4" stroke-linecap="round"></line>'
      );
    }

    markup.push(
      '<circle r="' + formatNumber(innerRadius - 2) + '" fill="none" stroke="#5c4b3a" stroke-opacity="0.18" stroke-width="1.2"></circle>'
    );
    markup.push(
      '<circle r="' + formatNumber(outerRadius - 4) + '" fill="none" stroke="#5c4b3a" stroke-opacity="0.18" stroke-width="1.2"></circle>'
    );
    markup.push(
      '<path d="' + createDonutSectorPath(innerRadius + 8, outerRadius - 14, 318, 394) +
      '" fill="rgba(255,255,255,0.34)"></path>'
    );

    return markup.join("");
  }

  function renderPlacardSlots(disc) {
    if (!disc.sectorSlots || !disc.sectorSlots.length || !disc.itemUrls || !disc.itemUrls.length) {
      return "";
    }

    var radii = getSectorRadii(disc);
    var markup = [
      '<g class="dress-disc__slots dress-disc__slots--upright" data-disc-placards="' + disc.id + '">'
    ];
    disc.sectorSlots.forEach(function (slot) {
      markup.push(renderHotpotPlacard(disc, slot, radii.inner, radii.outer));
    });
    markup.push("</g>");
    return markup.join("");
  }

  function getImageHref(imageEl) {
    if (!imageEl) return "";
    return imageEl.getAttribute("href") ||
      imageEl.getAttributeNS("http://www.w3.org/1999/xlink", "href") ||
      "";
  }

  function hrefMatches(imageHref, targetUrl) {
    if (!imageHref || !targetUrl) return false;
    if (imageHref === targetUrl) return true;
    if (imageHref.endsWith(targetUrl) || targetUrl.endsWith(imageHref)) return true;

    try {
      var base = window.location.href;
      return new URL(imageHref, base).href === new URL(targetUrl, base).href;
    } catch (err) {
      return false;
    }
  }

  function rememberImageSize(url, naturalW, naturalH) {
    if (!url || !naturalW || !naturalH) return;
    imageSizeCache[url] = { w: naturalW, h: naturalH };
  }

  function lookupImageSize(href) {
    if (!href) return null;
    if (imageSizeCache[href]) return imageSizeCache[href];

    var key;
    for (key in imageSizeCache) {
      if (hrefMatches(href, key)) return imageSizeCache[key];
    }

    return null;
  }

  /** 盘面坐标 + 转子角 → 盘面投影坐标（未 scale） */
  function getSlotPositionInProject(disc, localX, localY) {
    var rad = disc.angle * Math.PI / 180;
    var cos = Math.cos(rad);
    var sin = Math.sin(rad);

    return {
      x: localX * cos - localY * sin,
      y: localX * sin + localY * cos
    };
  }

  /** viewBox 坐标：立牌不在椭圆 scale 组内，屏幕比例与原图一致 */
  function getSlotPositionInViewBox(disc, localX, localY) {
    var pos = getSlotPositionInProject(disc, localX, localY);
    var scaleY = getDiscProjectScaleY(disc);

    return {
      x: disc.cx + pos.x,
      y: disc.cy + pos.y * scaleY
    };
  }

  function getRotorSlotDepth(slotX, slotY, discAngle) {
    var rad = discAngle * Math.PI / 180;
    return slotX * Math.sin(rad) + slotY * Math.cos(rad);
  }

  function getDiscProjectScaleY(disc) {
    if (!disc || !disc.rx) return 1;
    return disc.ry / disc.rx;
  }

  /** 按原图宽高比缩放，最长边不超过 maxDim */
  function scaleImageToMax(naturalW, naturalH, maxDim) {
    if (!naturalW || !naturalH) {
      return { w: maxDim, h: maxDim };
    }

    var scale = maxDim / Math.max(naturalW, naturalH);
    return {
      w: naturalW * scale,
      h: naturalH * scale
    };
  }

  function applyPlacardImageLayout(imageEl, naturalW, naturalH) {
    if (!imageEl) return;

    var cached = lookupImageSize(getImageHref(imageEl));
    if ((!naturalW || !naturalH) && cached) {
      naturalW = cached.w;
      naturalH = cached.h;
    }

    if (!naturalW || !naturalH) return;

    var maxDim = parseFloat(imageEl.getAttribute("data-max-dim")) || 24;
    var size = scaleImageToMax(naturalW, naturalH, maxDim);

    imageEl.setAttribute("x", formatNumber(-size.w / 2));
    imageEl.setAttribute("y", formatNumber(-size.h));
    imageEl.setAttribute("width", formatNumber(size.w));
    imageEl.setAttribute("height", formatNumber(size.h));
    imageEl.removeAttribute("preserveAspectRatio");
    imageEl.removeAttribute("opacity");
  }

  function getSlotCenterOnDisc(disc, slot, innerRadius, outerRadius) {
    var slotRadius = innerRadius + (outerRadius - innerRadius) * CELL_RADIUS_RATIO;
    var pos = polarToCartesian(slotRadius, slot.centerAngle);

    return {
      x: pos.x,
      y: pos.y,
      centerAngle: slot.centerAngle
    };
  }

  function renderHotpotPlacard(disc, slot, innerRadius, outerRadius) {
    var center = getSlotCenterOnDisc(disc, slot, innerRadius, outerRadius);
    var anchor = getSlotPositionInViewBox(disc, center.x, center.y);
    var src = getItemSrc(disc, slot.index);
    var slotKey = getSlotKey(disc.id, slot.index);
    var maxDim = disc.itemSize || 24;
    var lift = disc.placardLift || 0;
    var baseRx = Math.max(3, Math.round(maxDim * 0.2));
    var baseRy = Math.max(2, Math.round(maxDim * 0.09));

    return (
      '<g class="dress-disc__slot" data-dress-slot="' + slotKey + '"' +
        ' data-slot-index="' + slot.index + '"' +
        ' data-slot-x="' + formatNumber(center.x) + '"' +
        ' data-slot-y="' + formatNumber(center.y) + '"' +
        ' data-depth-view="' + formatNumber(anchor.y) + '"' +
        ' transform="translate(' + formatNumber(anchor.x) + " " + formatNumber(anchor.y) + ')">' +
        '<ellipse class="dress-disc__slot-base" cx="0" cy="0"' +
          ' rx="' + formatNumber(baseRx) + '" ry="' + formatNumber(baseRy) + '"></ellipse>' +
        '<g class="dress-disc__placard-rise" transform="translate(0 ' + formatNumber(-lift) + ')">' +
          '<g class="dress-disc__placard-body">' +
            '<image class="dress-disc__slot-image" data-dress-slot-image="' + slotKey + '"' +
              ' data-max-dim="' + formatNumber(maxDim) + '"' +
              ' href="' + escapeAttr(src) + '"' +
              ' opacity="0"></image>' +
          "</g>" +
        "</g>" +
      "</g>"
    );
  }

  function renderSurface(disc) {
    var scaleY = disc.ry / disc.rx;

    return (
      '<g class="dress-disc__surface-project" transform="translate(' + formatNumber(disc.cx) + " " + formatNumber(disc.cy) + ') scale(1 ' + formatNumber(scaleY) + ')">' +
        '<circle r="' + formatNumber(disc.rx) + '" fill="' + disc.topColor + '"></circle>' +
        '<g class="dress-disc__surface-rotor" data-disc-rotor="' + disc.id + '" transform="rotate(' + formatNumber(disc.angle) + ')">' +
          renderSectorMarkup(disc) +
        "</g>" +
      "</g>"
    );
  }

  function renderCenterCap(disc) {
    var capRx = Math.max(8, disc.rx * 0.16);
    var capRy = Math.max(4, disc.ry * 0.34);

    return (
      '<g class="dress-disc__cap" transform="translate(' + formatNumber(disc.cx) + " " + formatNumber(disc.cy) + ')">' +
        '<ellipse rx="' + formatNumber(capRx) + '" ry="' + formatNumber(capRy) + '" fill="' + disc.capColor + '" stroke="#5c4b3a" stroke-width="1.5"></ellipse>' +
        '<ellipse rx="' + formatNumber(capRx * 0.52) + '" ry="' + formatNumber(capRy * 0.52) + '" fill="#ffffff" fill-opacity="0.66"></ellipse>' +
      "</g>"
    );
  }

  function renderDisc(disc) {
    return (
      '<g class="dress-disc dress-disc--' + disc.id + '" data-disc="' + disc.id + '">' +
        '<path class="dress-disc__side" d="' + createSidePath(disc) + '" fill="url(#' + disc.sideGradientId + ')"></path>' +
        '<path class="dress-disc__side-outline" d="' + createSideOutlinePath(disc) + '" fill="none" stroke="#5c4b3a" stroke-width="2.2" stroke-linejoin="round"></path>' +
        renderSurface(disc) +
        renderPlacardSlots(disc) +
        '<ellipse class="dress-disc__outline" cx="' + formatNumber(disc.cx) + '" cy="' + formatNumber(disc.cy) + '" rx="' + formatNumber(disc.rx) + '" ry="' + formatNumber(disc.ry) + '" fill="none" stroke="#5c4b3a" stroke-width="2.2"></ellipse>' +
        renderCenterCap(disc) +
      "</g>"
    );
  }

  function renderHitArea(disc) {
    var scaleY = disc.ry / disc.rx;

    return (
      '<g class="dress-disc__hit-project" transform="translate(' + formatNumber(disc.cx) + " " + formatNumber(disc.cy) + ') scale(1 ' + formatNumber(scaleY) + ')">' +
        '<path class="dress-disc__hit" data-disc-hit="' + disc.id + '"' +
          ' d="' + createRingPath(disc.rx, disc.hitInnerRadius) + '"' +
          ' fill="rgba(255,255,255,0.001)" fill-rule="evenodd"></path>' +
      "</g>"
    );
  }

  function renderSvg(state) {
    return (
      '<svg class="dress-turntable" data-dress-svg viewBox="0 0 ' + VIEWBOX_WIDTH + " " + VIEWBOX_HEIGHT + '" role="img" aria-label="三层椭圆转盘">' +
        "<defs>" +
          '<linearGradient id="dress-base-side" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#e8dfd1"></stop>' +
            '<stop offset="100%" stop-color="#c4a882"></stop>' +
          "</linearGradient>" +
          '<linearGradient id="dress-mid-side" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#f7ecec"></stop>' +
            '<stop offset="100%" stop-color="#e8dfd1"></stop>' +
          "</linearGradient>" +
          '<linearGradient id="dress-top-side" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#c8d8ba"></stop>' +
            '<stop offset="100%" stop-color="#8fbc8f"></stop>' +
          "</linearGradient>" +
          '<radialGradient id="dress-floor-shadow" cx="50%" cy="50%" r="50%">' +
            '<stop offset="0%" stop-color="#5c4b3a" stop-opacity="0.16"></stop>' +
            '<stop offset="100%" stop-color="#5c4b3a" stop-opacity="0"></stop>' +
          "</radialGradient>" +
        "</defs>" +
        '<ellipse cx="190" cy="362" rx="156" ry="24" fill="url(#dress-floor-shadow)"></ellipse>' +
        state.discs.map(renderDisc).join("") +
        '<g class="dress-disc__hit-layer">' +
          DISC_IDS.map(function (discId) {
            return renderHitArea(findDisc(state, discId));
          }).join("") +
        "</g>" +
      "</svg>"
    );
  }

  function renderIndicator(disc) {
    return (
      '<div class="dress-indicator" data-disc-indicator="' + disc.id + '">' +
        '<span class="dress-indicator__swatch dress-indicator__swatch--' + disc.id + '"></span>' +
        '<span class="dress-indicator__label">' + util.escapeHtml(disc.label) + "</span>" +
        '<span class="dress-indicator__meta">' + util.escapeHtml(disc.autoSpeed + "°/s") + "</span>" +
      "</div>"
    );
  }

  function render(state) {
    return (
      '<div class="dress-root" data-phase="' + util.escapeHtml(state.phase) + '">' +
        '<section class="card dress-stage-card">' +
          '<div class="dress-stage-card__head">' +
            '<p class="dress-stage-card__kicker caption">Ellipse Turntable</p>' +
            '<h2 class="dress-stage-card__title">三层独立可拖动转盘</h2>' +
            '<p class="dress-stage-card__desc caption">盘体厚度固定不动；扇区随盘旋转，立牌槽位公转，牌身始终朝屏幕上方竖起。</p>' +
          "</div>" +
          '<div class="dress-stage" data-dress-stage>' +
            renderSvg(state) +
          "</div>" +
          '<div class="dress-status">' +
            '<p class="dress-status__text caption" data-dress-status>正在自动转动，拖动任意可见盘面即可单独接管。</p>' +
            '<div class="dress-indicators">' +
              state.discs.map(renderIndicator).join("") +
            "</div>" +
          "</div>" +
        "</section>" +
        '<section class="card dress-note-card">' +
          '<div class="dress-note-card__row">' +
            '<h3 class="dress-note-card__title">交互说明</h3>' +
            '<p class="caption">顶盘整面可拖，中盘和底盘只在露出的环带区域响应拖动。</p>' +
          "</div>" +
          '<ul class="dress-note-list">' +
            "<li>三层都绕自身中心轴原地自转，不是整张椭圆在平面里整体旋转。</li>" +
            "<li>每层都有自己的角度与速度，立牌格心随扇区公转，牌身方向始终向上、不随半径倾斜。</li>" +
            "<li>默认同向不同速自动转动，松手后会从当前角度继续旋转。</li>" +
            "<li>鼠标和触摸都可以直接拖拽，盘体的外轮廓与厚度不会漂移。</li>" +
          "</ul>" +
        "</section>" +
      "</div>"
    );
  }

  function getSvgPoint(runtimeRef, event) {
    if (!runtimeRef || !runtimeRef.svg) return null;
    var point = runtimeRef.svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    var ctm = runtimeRef.svg.getScreenCTM();
    if (!ctm) return null;
    return point.matrixTransform(ctm.inverse());
  }

  function getPointerAngle(disc, svgPoint) {
    if (!disc || !svgPoint) return null;

    var scaleY = disc.ry / disc.rx;
    var localX = svgPoint.x - disc.cx;
    var localY = (svgPoint.y - disc.cy) / scaleY;
    var radius = Math.sqrt((localX * localX) + (localY * localY));

    if (radius < Math.max(10, disc.sectorInnerRadius * 0.32)) {
      return null;
    }

    return normalizeAngle((Math.atan2(localY, localX) * 180 / Math.PI) + 90);
  }

  function updatePlacardPositions(disc) {
    if (!runtime) return;

    var bucket = runtime.placardBuckets[disc.id];
    if (!bucket) return;

    bucket.querySelectorAll("[data-dress-slot]").forEach(function (slotNode) {
      var localX = parseFloat(slotNode.getAttribute("data-slot-x") || "0");
      var localY = parseFloat(slotNode.getAttribute("data-slot-y") || "0");
      var anchor = getSlotPositionInViewBox(disc, localX, localY);

      slotNode.setAttribute(
        "transform",
        "translate(" + formatNumber(anchor.x) + " " + formatNumber(anchor.y) + ")"
      );
      slotNode.setAttribute("data-depth-view", formatNumber(anchor.y));
    });
  }

  function updateRotor(disc) {
    if (!runtime) return;

    var rotate = "rotate(" + formatNumber(disc.angle) + ")";

    if (runtime.rotors[disc.id]) {
      runtime.rotors[disc.id].setAttribute("transform", rotate);
    }

    updatePlacardPositions(disc);
    sortPlacardDepth(disc);
  }

  function sortPlacardDepth(disc) {
    var bucket = runtime && runtime.placardBuckets[disc.id];
    if (!bucket) return;

    var slots = Array.prototype.slice.call(bucket.querySelectorAll("[data-dress-slot]"));
    slots.sort(function (a, b) {
      return parseFloat(a.getAttribute("data-depth-view") || "0") -
        parseFloat(b.getAttribute("data-depth-view") || "0");
    });

    slots.forEach(function (node) {
      bucket.appendChild(node);
    });
  }

  function layoutPlacardImages(container) {
    if (!container) return;

    container.querySelectorAll("[data-dress-slot-image]").forEach(function (imageEl) {
      var href = getImageHref(imageEl);
      var cached = lookupImageSize(href);

      function layoutFromDimensions(naturalW, naturalH) {
        rememberImageSize(href, naturalW, naturalH);
        applyPlacardImageLayout(imageEl, naturalW, naturalH);
      }

      if (cached) {
        layoutFromDimensions(cached.w, cached.h);
        return;
      }

      function layoutFromElement() {
        if (imageEl.naturalWidth && imageEl.naturalHeight) {
          layoutFromDimensions(imageEl.naturalWidth, imageEl.naturalHeight);
        }
      }

      if (imageEl.complete) {
        layoutFromElement();
      }

      imageEl.addEventListener("load", layoutFromElement, { once: true });
    });
  }

  function layoutPlacardsForUrl(container, url, naturalW, naturalH) {
    if (!container || !url || !naturalW || !naturalH) return;

    rememberImageSize(url, naturalW, naturalH);
    container.querySelectorAll("[data-dress-slot-image]").forEach(function (imageEl) {
      if (!hrefMatches(getImageHref(imageEl), url)) return;
      applyPlacardImageLayout(imageEl, naturalW, naturalH);
    });
  }

  function preloadDiscItems(state, container) {
    var seen = {};

    state.discs.forEach(function (disc) {
      if (!disc.itemUrls) return;
      disc.itemUrls.forEach(function (url) {
        if (!url || seen[url]) return;
        seen[url] = true;

        var cached = imageSizeCache[url];
        if (cached) {
          layoutPlacardsForUrl(container, url, cached.w, cached.h);
          return;
        }

        var img = new Image();
        img.decoding = "async";
        img.onload = function () {
          layoutPlacardsForUrl(container, url, img.naturalWidth, img.naturalHeight);
        };
        img.onerror = function () {
          /* 保留占位，避免错误尺寸 */
        };
        img.src = url;
      });
    });
  }

  function collectSlotRefs(container) {
    var slotImages = {};
    var slotNodes = {};

    container.querySelectorAll("[data-dress-slot-image]").forEach(function (imageEl) {
      var key = imageEl.getAttribute("data-dress-slot-image");
      if (key) slotImages[key] = imageEl;
    });

    container.querySelectorAll("[data-dress-slot]").forEach(function (slotEl) {
      var key = slotEl.getAttribute("data-dress-slot");
      if (key) slotNodes[key] = slotEl;
    });

    return { slotImages: slotImages, slotNodes: slotNodes };
  }

  function updateIndicators(state) {
    if (!runtime) return;

    var activeId = state.activeDiscId;

    Object.keys(runtime.indicators).forEach(function (discId) {
      runtime.indicators[discId].classList.toggle("is-active", activeId === discId);
    });

    if (!runtime.statusText) return;

    if (!activeId) {
      runtime.statusText.textContent = "正在自动转动，拖动任意可见盘面即可单独接管。";
      return;
    }

    var disc = findDisc(state, activeId);
    runtime.statusText.textContent = disc ?
      (disc.label + " 正在被拖动，松手后会继续自动旋转。") :
      "正在自动转动，拖动任意可见盘面即可单独接管。";
  }

  function animateFrame(timestamp) {
    if (!runtime || !runtime.state || !runtime.running) return;

    var state = runtime.state;

    if (!state.lastTick) {
      state.lastTick = timestamp;
    }

    var delta = Math.min((timestamp - state.lastTick) / 1000, 0.04);
    state.lastTick = timestamp;

    state.discs.forEach(function (disc) {
      if (disc.dragging) return;
      disc.angle = normalizeAngle(disc.angle + (disc.autoSpeed * delta));
      updateRotor(disc);
    });

    runtime.rafId = window.requestAnimationFrame(animateFrame);
  }

  function startAnimation() {
    if (!runtime || runtime.running) return;
    runtime.running = true;
    runtime.state.lastTick = 0;
    runtime.rafId = window.requestAnimationFrame(animateFrame);
  }

  function stopAnimation() {
    if (!runtime) return;
    runtime.running = false;
    runtime.state.lastTick = 0;
    if (runtime.rafId) {
      window.cancelAnimationFrame(runtime.rafId);
      runtime.rafId = 0;
    }
  }

  function handlePointerDown(event) {
    if (!runtime) return;

    var hit = event.target.closest("[data-disc-hit]");
    if (!hit) return;

    var discId = hit.getAttribute("data-disc-hit");
    var disc = findDisc(runtime.state, discId);
    var svgPoint = getSvgPoint(runtime, event);
    var pointerAngle = getPointerAngle(disc, svgPoint);

    if (!disc || pointerAngle == null) return;

    disc.dragging = true;
    disc.pointerId = event.pointerId;
    disc.lastPointerAngle = pointerAngle;
    runtime.state.activeDiscId = disc.id;
    runtime.state.activePointerId = event.pointerId;
    runtime.activeHitTarget = hit;

    if (typeof hit.setPointerCapture === "function") {
      hit.setPointerCapture(event.pointerId);
    }

    updateIndicators(runtime.state);
    event.preventDefault();
  }

  function handlePointerMove(event) {
    if (!runtime || !runtime.state.activeDiscId) return;

    var disc = runtime.state.discs.find(function (item) {
      return item.pointerId === event.pointerId && item.dragging;
    });

    if (!disc) return;

    var svgPoint = getSvgPoint(runtime, event);
    var pointerAngle = getPointerAngle(disc, svgPoint);

    if (pointerAngle == null) return;

    disc.angle = normalizeAngle(disc.angle + angleDelta(pointerAngle, disc.lastPointerAngle));
    disc.lastPointerAngle = pointerAngle;
    updateRotor(disc);
    event.preventDefault();
  }

  function releaseDrag(pointerId) {
    if (!runtime) return;

    runtime.state.discs.forEach(function (disc) {
      if (disc.pointerId !== pointerId) return;
      disc.dragging = false;
      disc.pointerId = null;
      disc.lastPointerAngle = null;
    });

    runtime.state.activeDiscId = null;
    runtime.state.activePointerId = null;
    updateIndicators(runtime.state);
  }

  function handlePointerUp(event) {
    if (!runtime) return;

    if (runtime.activeHitTarget && typeof runtime.activeHitTarget.releasePointerCapture === "function") {
      try {
        runtime.activeHitTarget.releasePointerCapture(event.pointerId);
      } catch (err) {
        /* ignore */
      }
    }

    releaseDrag(event.pointerId);
  }

  function bind(container, ctx, state) {
    var stage = container.querySelector("[data-dress-stage]");
    var svg = container.querySelector("[data-dress-svg]");
    var statusText = container.querySelector("[data-dress-status]");
    var unbinds = [];
    var indicatorMap = {};
    var rotorMap = {};
    var placardBucketMap = {};

    DISC_IDS.forEach(function (discId) {
      var rotor = container.querySelector('[data-disc-rotor="' + discId + '"]');
      if (rotor) rotorMap[discId] = rotor;

      var placards = container.querySelector('[data-disc-placards="' + discId + '"]');
      if (placards) placardBucketMap[discId] = placards;

      var indicator = container.querySelector('[data-disc-indicator="' + discId + '"]');
      if (indicator) indicatorMap[discId] = indicator;
    });

    var slotRefs = collectSlotRefs(container);

    runtime = {
      container: container,
      ctx: ctx,
      state: state,
      stage: stage,
      svg: svg,
      rotors: rotorMap,
      placardBuckets: placardBucketMap,
      slotImages: slotRefs.slotImages,
      slotNodes: slotRefs.slotNodes,
      indicators: indicatorMap,
      statusText: statusText,
      activeHitTarget: null,
      running: false,
      rafId: 0,
      unbinds: unbinds
    };

    state.discs.forEach(function (disc) {
      updatePlacardPositions(disc);
      sortPlacardDepth(disc);
    });

    preloadDiscItems(state, container);
    layoutPlacardImages(container);

    unbinds.push(util.on(stage, "pointerdown", handlePointerDown));
    unbinds.push(util.on(stage, "pointermove", handlePointerMove));
    unbinds.push(util.on(stage, "pointerup", handlePointerUp));
    unbinds.push(util.on(stage, "pointercancel", handlePointerUp));
    unbinds.push(util.on(stage, "lostpointercapture", handlePointerUp));

    updateIndicators(state);
    startAnimation();
  }

  function unbind() {
    if (!runtime) return;

    stopAnimation();

    runtime.unbinds.forEach(function (off) {
      if (typeof off === "function") off();
    });

    runtime = null;
    imageSizeCache = {};
  }

  root.view = {
    render: render,
    bind: bind,
    unbind: unbind,
    pause: stopAnimation,
    resume: startAnimation
  };
})(typeof window !== "undefined" ? window : this);
