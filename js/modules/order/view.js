(function (global) {
  "use strict";

  var util = global.Yummi.util;
  var root = global.Yummi.modules.order;
  var runtime = null;
  var imageSizeCache = {};
  var VIEWBOX_WIDTH = 380;
  var VIEWBOX_HEIGHT = 398;
  var DISC_IDS = ["base", "mid", "top", "cap"];

  function getCapAssetBase() {
    var tb = root.config && root.config.turntable;
    return (tb && tb.capAssetsBase) || "wmx-temporary/转盘/assets/cats/";
  }

  function getCapSideImages() {
    var base = getCapAssetBase();
    return [
      base + "IMG_20260530_125819.jpg",
      base + "IMG_20260530_125904.jpg",
      base + "IMG_20260530_125935.jpg",
      base + "IMG_20260530_125618.jpg",
      base + "IMG_20260530_125748.jpg",
      base + "IMG_20260530_125756.jpg",
      base + "IMG_20260530_125605.jpg",
      base + "IMG_20260530_125740.jpg"
    ];
  }

  function getCapTopTexture() {
    return getCapAssetBase() + "top-texture-cat.jpg";
  }
  var INERTIA_VELOCITY_EPS = 0.01;
  var INERTIA_DECAY_PER_SEC = 0.88;
  var TURNTABLE_DESKTOP_MQ = "(min-width: 431px)";
  /** 立牌绘制顺序：先画的在下，底盘最后画在最上 */
  var PLACARD_LAYER_ORDER = ["top", "mid", "base"];
  var CELL_RADIUS_RATIO = 0.58;
  var PLACARD_PRESENCE = {
    minScale: 0,
    maxScale: 1,
    minOpacity: 0,
    maxOpacity: 1,
    maxBlurPx: 4,
    /** 轨道角 θ = normalize(αslot + δdisc)；渐实/渐虚各 10°，纯实区左右各收窄 10°（相对原 70°–260°） */
    solidStartDeg: 70,
    solidEndDeg: 80,
    fadeStartDeg: 250,
    fadeEndDeg: 260,
    /** 换菜只在此角度触发一次（须先经过 swapRearmDeg 以下重新武装） */
    swapDeg: 275,
    swapRearmDeg: 90
  };

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function lerp(min, max, t) {
    return min + (max - min) * t;
  }

  /** 硬性定义：θ = 格心角 + 盘面角，不用 atan2 / 屏幕坐标 */
  function getSlotOrbitDeg(disc, centerAngle) {
    return normalizeAngle(centerAngle + disc.angle);
  }

  /**
   * 0 = 虚小，1 = 实大。θ∈[70,80] 渐实；(80,250) 纯实；[250,260] 渐虚；其余恒 0。
   */
  function getPlacardPresenceT(disc, centerAngle) {
    var p = PLACARD_PRESENCE;
    var deg = getSlotOrbitDeg(disc, centerAngle);
    var solidSpan = p.solidEndDeg - p.solidStartDeg;
    var fadeSpan = p.fadeEndDeg - p.fadeStartDeg;

    if (deg >= p.solidStartDeg && deg <= p.solidEndDeg) {
      return clamp01((deg - p.solidStartDeg) / solidSpan);
    }

    if (deg >= p.fadeStartDeg && deg <= p.fadeEndDeg) {
      return clamp01(1 - (deg - p.fadeStartDeg) / fadeSpan);
    }

    if (deg > p.solidEndDeg && deg < p.fadeStartDeg) {
      return 1;
    }

    return 0;
  }

  function escapeAttr(text) {
    return util.escapeHtml(text).replace(/"/g, "&quot;");
  }

  function getItemSrcForSlot(disc, slot) {
    var idx = slot.imageIndex;

    if (idx === undefined || idx === null) {
      idx = slot.index;
    }

    if (!disc.itemUrls || !disc.itemUrls[idx]) {
      return "";
    }

    return disc.itemUrls[idx];
  }

  function buildPlacardImageUrl(url, swapGeneration) {
    if (!url) {
      return "";
    }

    if (swapGeneration === undefined || swapGeneration === null) {
      return url;
    }

    return url + (url.indexOf("?") >= 0 ? "&" : "?") + "v=" + swapGeneration;
  }

  function setPlacardImageHref(imageEl, url, swapGeneration) {
    var src;

    if (!imageEl || !url) {
      return;
    }

    src = buildPlacardImageUrl(url, swapGeneration);
    imageEl.setAttributeNS("http://www.w3.org/1999/xlink", "href", src);
    imageEl.setAttribute("href", src);
  }

  function getSlotImageEl(disc, slot, slotNode) {
    var key = getSlotKey(disc.id, slot.index);

    if (runtime && runtime.slotImages && runtime.slotImages[key]) {
      return runtime.slotImages[key];
    }

    return slotNode ? slotNode.querySelector("[data-order-slot-image]") : null;
  }

  /**
   * 换菜节点：θ 到达 swapDeg（默认 275°）且已 re-arm 时执行一次；
   * 此前须 θ < swapRearmDeg（默认 90°）才会 re-arm，保证每圈最多换一次。
   */
  function maybeCycleSlotItemAtSwapAngle(disc, slot, slotNode, orbitDeg) {
    var p = PLACARD_PRESENCE;

    if (orbitDeg < p.swapRearmDeg) {
      slot.swapArmed = true;
    }

    if (!slot.swapArmed || orbitDeg < p.swapDeg) {
      return;
    }

    slot.swapArmed = false;
    cycleSlotItem(disc, slot, slotNode);
  }

  function ensureSlotImageMatchesState(disc, slot, slotNode, reveal) {
    var imageEl = getSlotImageEl(disc, slot, slotNode);
    var url;
    var cached;

    if (!imageEl || !disc.itemUrls) {
      return;
    }

    url = disc.itemUrls[Number(slot.imageIndex)];

    if (!url) {
      return;
    }

    if (!hrefMatches(getImageHref(imageEl), url) || slot.pendingReveal) {
      setPlacardImageHref(imageEl, url, slot.swapGeneration);
      cached = lookupImageSize(url);

      if (cached) {
        applyPlacardImageLayout(imageEl, cached.w, cached.h, !reveal);
      }

      slot.pendingReveal = false;
    }

    if (reveal) {
      imageEl.removeAttribute("opacity");
    } else {
      imageEl.setAttribute("opacity", "0");
    }
  }

  function cycleSlotItem(disc, slot, slotNode) {
    var urls = disc.itemUrls;
    var imageEl;
    var url;
    var cached;
    var previousIndex;
    var nextIndex;

    if (!urls || !urls.length || !slotNode) {
      return;
    }

    imageEl = getSlotImageEl(disc, slot, slotNode);

    if (!imageEl) {
      return;
    }

    previousIndex = Number(slot.imageIndex);
    nextIndex = root.state.pickNextFoodIndex(disc, slot, previousIndex);

    if (nextIndex === previousIndex) {
      return;
    }

    slot.imageIndex = nextIndex;
    slot.swapGeneration = (slot.swapGeneration || 0) + 1;
    slot.pendingReveal = true;
    url = urls[nextIndex];
    setPlacardImageHref(imageEl, url, slot.swapGeneration);
    imageEl.setAttribute("opacity", "0");

    cached = lookupImageSize(url);

    if (cached) {
      applyPlacardImageLayout(imageEl, cached.w, cached.h, true);
      return;
    }

    var loader = new Image();
    loader.decoding = "async";
    loader.onload = function () {
      if (!hrefMatches(getImageHref(imageEl), url)) {
        return;
      }

      rememberImageSize(url, loader.naturalWidth, loader.naturalHeight);
      applyPlacardImageLayout(imageEl, loader.naturalWidth, loader.naturalHeight, true);
    };
    loader.src = url;
  }

  function getSlotKey(discId, slotIndex) {
    return discId + "-" + slotIndex;
  }

  function getSectorRadii(geometry) {
    return {
      outer: geometry.rx - 6,
      inner: Math.max(geometry.sectorInnerRadius, 12)
    };
  }

  /** 与 wmx 转盘原型 getDiscGeometry 一致 */
  function getDiscGeometry(disc, global) {
    var g = global || {};
    var scale = (g.globalScale || 1) * (disc.scale || 1);
    var layerUnit = (disc.baseCy - 148) / 64;

    return {
      id: disc.id,
      cx: disc.baseCx + (g.offsetX || 0) + (disc.x || 0),
      cy: 148 + (layerUnit * 64 * (g.layerGap || 1)) + (g.offsetY || 0) + (disc.y || 0),
      rx: disc.baseRx * scale,
      ry: disc.baseRy * scale * (g.ellipseRatio || 1),
      height: 42 * (g.discHeight || 1) * (disc.heightScale || 1) * scale * (disc.baseRx / 72),
      angle: disc.angle,
      hitInnerRadius: disc.hitInnerRadius > 0 ? disc.hitInnerRadius * scale : 0,
      sectorInnerRadius: disc.sectorInnerRadius * scale,
      topColor: disc.topColor,
      capColor: disc.capColor,
      sideGradientId: disc.sideGradientId
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
    return Number(value.toFixed(3));
  }

  function formatViewBox(box) {
    return (
      formatNumber(box.x) + " " +
      formatNumber(box.y) + " " +
      formatNumber(box.w) + " " +
      formatNumber(box.h)
    );
  }

  function getTurntableViewBox(state) {
    var globalCfg = state.global || {};
    var minY = Infinity;
    var maxY = -Infinity;

    state.discs.forEach(function (disc) {
      var geo = getDiscGeometry(disc, globalCfg);
      minY = Math.min(minY, geo.cy - geo.height - 8);
      maxY = Math.max(maxY, geo.cy + geo.height + 8);
    });

    var baseDisc = findDisc(state, "base");
    if (baseDisc) {
      var baseGeo = getDiscGeometry(baseDisc, globalCfg);
      maxY = Math.max(
        maxY,
        baseGeo.cy + baseGeo.height + 12 + Math.max(18, baseGeo.ry * 0.64)
      );
    }

    if (!isFinite(minY) || !isFinite(maxY)) {
      return { x: 0, y: 0, w: VIEWBOX_WIDTH, h: VIEWBOX_HEIGHT };
    }

    var padY = 6;
    var y = Math.max(0, minY - padY);
    var h = Math.min(VIEWBOX_HEIGHT - y, maxY - minY + padY * 2);
    h = Math.max(h, 280);

    return { x: 0, y: y, w: VIEWBOX_WIDTH, h: h };
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

  function createSidePath(geometry) {
    var left = geometry.cx - geometry.rx;
    var right = geometry.cx + geometry.rx;
    var top = geometry.cy;
    var bottom = geometry.cy + geometry.height;

    return [
      "M", formatNumber(left), formatNumber(top),
      "L", formatNumber(left), formatNumber(bottom),
      "A", formatNumber(geometry.rx), formatNumber(geometry.ry), 0, 0, 0, formatNumber(right), formatNumber(bottom),
      "L", formatNumber(right), formatNumber(top),
      "A", formatNumber(geometry.rx), formatNumber(geometry.ry), 0, 0, 1, formatNumber(left), formatNumber(top),
      "Z"
    ].join(" ");
  }

  function createSideOutlinePath(geometry) {
    var left = geometry.cx - geometry.rx;
    var right = geometry.cx + geometry.rx;
    var top = geometry.cy;
    var bottom = geometry.cy + geometry.height;

    return [
      "M", formatNumber(left), formatNumber(top),
      "L", formatNumber(left), formatNumber(bottom),
      "A", formatNumber(geometry.rx), formatNumber(geometry.ry), 0, 0, 0, formatNumber(right), formatNumber(bottom),
      "L", formatNumber(right), formatNumber(top)
    ].join(" ");
  }

  function createUpperSideHitPath(geometry) {
    var left = geometry.cx - geometry.rx;
    var right = geometry.cx + geometry.rx;
    var top = geometry.cy;
    var middle = geometry.cy + (geometry.height * 0.56);

    return [
      "M", formatNumber(left), formatNumber(top),
      "L", formatNumber(left), formatNumber(middle),
      "A", formatNumber(geometry.rx), formatNumber(geometry.ry), 0, 0, 0, formatNumber(right), formatNumber(middle),
      "L", formatNumber(right), formatNumber(top),
      "A", formatNumber(geometry.rx), formatNumber(geometry.ry), 0, 0, 1, formatNumber(left), formatNumber(top),
      "Z"
    ].join(" ");
  }

  function createSectorAngleRanges(count, angle) {
    var ranges = [];
    var step = 360 / count;
    var i;

    for (i = 0; i < count; i += 1) {
      ranges.push({
        index: i,
        start: normalizeAngle(i * step + angle),
        end: normalizeAngle((i + 1) * step + angle)
      });
    }

    return ranges;
  }

  function getVisibleSectorSegments(range) {
    var segments = [];
    var start = normalizeAngle(range.start);
    var end = normalizeAngle(range.end);
    var candidateOffsets = [-360, 0, 360];
    var visibleWindows = [
      { start: 90, end: 270 },
      { start: 450, end: 630 },
      { start: -270, end: -90 }
    ];
    var i;
    var j;

    if (end <= start) {
      end += 360;
    }

    for (i = 0; i < candidateOffsets.length; i += 1) {
      var shiftedStart = start + candidateOffsets[i];
      var shiftedEnd = end + candidateOffsets[i];

      for (j = 0; j < visibleWindows.length; j += 1) {
        var overlapStart = Math.max(shiftedStart, visibleWindows[j].start);
        var overlapEnd = Math.min(shiftedEnd, visibleWindows[j].end);

        if (overlapEnd - overlapStart > 0.001) {
          while (overlapStart > 270) {
            overlapStart -= 360;
            overlapEnd -= 360;
          }
          while (overlapEnd < 90) {
            overlapStart += 360;
            overlapEnd += 360;
          }
          segments.push({
            start: overlapStart,
            end: overlapEnd
          });
        }
      }
    }

    segments.sort(function (a, b) {
      return a.start - b.start;
    });

    return segments.filter(function (segment, index) {
      if (index === 0) return true;
      var prev = segments[index - 1];
      return Math.abs(prev.start - segment.start) > 0.001 ||
        Math.abs(prev.end - segment.end) > 0.001;
    });
  }

  function angleToEllipseX(angleDeg, rx) {
    var radians = angleDeg * Math.PI / 180;
    return rx * Math.sin(radians);
  }

  function ellipsePointOnFrontArc(angleDeg, geometry, offsetY) {
    var radians = angleDeg * Math.PI / 180;
    return {
      x: geometry.rx * Math.sin(radians),
      y: -geometry.ry * Math.cos(radians) + offsetY
    };
  }

  function sampleFrontArc(geometry, startAngle, endAngle, offsetY, reverse) {
    var points = [];
    var sweep = Math.max(2, Math.ceil(Math.abs(endAngle - startAngle) / 12));
    var i;

    for (i = 0; i <= sweep; i += 1) {
      var t = i / sweep;
      var angle = reverse
        ? endAngle + ((startAngle - endAngle) * t)
        : startAngle + ((endAngle - startAngle) * t);
      points.push(ellipsePointOnFrontArc(angle, geometry, offsetY));
    }

    return points;
  }

  function buildSideSectorPath(geometry, startAngle, endAngle) {
    var topPoints = sampleFrontArc(geometry, startAngle, endAngle, 0, false);
    var bottomPoints = sampleFrontArc(geometry, startAngle, endAngle, geometry.height, true);
    var parts = [];
    var i;

    parts.push("M", formatNumber(topPoints[0].x), formatNumber(topPoints[0].y));

    for (i = 1; i < topPoints.length; i += 1) {
      parts.push("L", formatNumber(topPoints[i].x), formatNumber(topPoints[i].y));
    }

    for (i = 0; i < bottomPoints.length; i += 1) {
      parts.push("L", formatNumber(bottomPoints[i].x), formatNumber(bottomPoints[i].y));
    }

    parts.push("Z");
    return parts.join(" ");
  }

  function renderSideColorBands(disc, geometry) {
    if (!disc.sectorColors || !disc.sectorColors.length) {
      return "";
    }

    var angleRanges = createSectorAngleRanges(disc.sectorColors.length, geometry.angle);
    var markup = [];
    var i;

    for (i = 0; i < angleRanges.length; i += 1) {
      var visibleRanges = getVisibleSectorSegments(angleRanges[i]);
      visibleRanges.forEach(function (segment) {
        var path = buildSideSectorPath(geometry, segment.start, segment.end);
        markup.push(
          '<path d="' + path + '" fill="' + disc.sectorColors[i] + '" fill-opacity="0.44"></path>'
        );
        markup.push(
          '<path d="' + path + '" fill="none" stroke="#5c4b3a" stroke-opacity="0.18" stroke-width="0.9"></path>'
        );
      });
    }

    return (
      '<g class="order-disc__side-colors" data-side-colors="' + disc.id + '"' +
        ' transform="translate(' + formatNumber(geometry.cx) + " " + formatNumber(geometry.cy) + ')">' +
        markup.join("") +
      "</g>"
    );
  }

  function renderCapSideImageBands(disc, geometry) {
    var segmentCount = 6;
    var angleRanges = createSectorAngleRanges(segmentCount, geometry.angle);
    var capSideImages = getCapSideImages();
    var markup = [];
    var i;

    for (i = 0; i < angleRanges.length; i += 1) {
      var visibleRanges = getVisibleSectorSegments(angleRanges[i]);
      visibleRanges.forEach(function (segment, segmentIndex) {
        var path = buildSideSectorPath(geometry, segment.start, segment.end);
        var clipId = "order-cap-side-" + i + "-" + segmentIndex;
        var x0 = Math.min(
          angleToEllipseX(segment.start, geometry.rx),
          angleToEllipseX(segment.end, geometry.rx)
        );
        var x1 = Math.max(
          angleToEllipseX(segment.start, geometry.rx),
          angleToEllipseX(segment.end, geometry.rx)
        );
        var width = Math.max(2, x1 - x0);
        var imagePadding = Math.max(0, geometry.rx * 0.06 * (1 - (width / (geometry.rx * 0.9))));
        var imageX = x0 - imagePadding;
        var imageWidth = width + imagePadding * 2;

        markup.push(
          "<defs>" +
            '<clipPath id="' + clipId + '">' +
              '<path d="' + path + '"></path>' +
            "</clipPath>" +
          "</defs>"
        );
        markup.push(
          '<g clip-path="url(#' + clipId + ')">' +
            '<image class="order-disc__side-band" href="' + escapeAttr(capSideImages[i % capSideImages.length]) + '"' +
              ' x="' + formatNumber(imageX - imageWidth * 0.1) + '" y="10"' +
              ' width="' + formatNumber(imageWidth * 1.2) + '" height="' + formatNumber(geometry.height * 1.2) + '"' +
              ' preserveAspectRatio="xMidYMid slice"></image>' +
          "</g>"
        );
        markup.push(
          '<path d="' + path + '" fill="none" stroke="#5c4b3a" stroke-opacity="0.22" stroke-width="0.9"></path>'
        );
      });
    }

    return (
      '<g class="order-disc__side-carousel" data-side-rotor="' + disc.id + '"' +
        ' transform="translate(' + formatNumber(geometry.cx) + " " + formatNumber(geometry.cy) + ')">' +
        markup.join("") +
      "</g>"
    );
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

  function renderSectorMarkup(disc, geometry) {
    if (!disc.sectorColors || !disc.sectorColors.length) {
      return "";
    }

    var outerRadius = geometry.rx - 6;
    var innerRadius = Math.max(geometry.sectorInnerRadius, 12);
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

  function renderPlacardSlots(disc, global) {
    if (!disc.sectorSlots || !disc.sectorSlots.length || !disc.itemUrls || !disc.itemUrls.length) {
      return "";
    }

    var geometry = getDiscGeometry(disc, global);
    var radii = getSectorRadii(geometry);
    var markup = [
      '<g class="order-disc__slots order-disc__slots--upright" data-disc-placards="' + disc.id + '">'
    ];
    disc.sectorSlots.forEach(function (slot) {
      markup.push(renderHotpotPlacard(disc, slot, radii.inner, radii.outer, geometry));
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
  function getSlotPositionInViewBox(disc, localX, localY, geometry) {
    var pos = getSlotPositionInProject(disc, localX, localY);
    var scaleY = geometry.ry / geometry.rx;

    return {
      x: geometry.cx + pos.x,
      y: geometry.cy + pos.y * scaleY
    };
  }

  function getRotorSlotDepth(slotX, slotY, discAngle) {
    var rad = discAngle * Math.PI / 180;
    return slotX * Math.sin(rad) + slotY * Math.cos(rad);
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

  function applyPlacardImageLayout(imageEl, naturalW, naturalH, keepHidden) {
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

    if (!keepHidden) {
      imageEl.removeAttribute("opacity");
    }
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

  function renderHotpotPlacard(disc, slot, innerRadius, outerRadius, geometry) {
    var center = getSlotCenterOnDisc(disc, slot, innerRadius, outerRadius);
    var anchor = getSlotPositionInViewBox(disc, center.x, center.y, geometry);
    var src = getItemSrcForSlot(disc, slot);
    var slotKey = getSlotKey(disc.id, slot.index);
    var maxDim = disc.itemSize || 24;
    var drop = disc.placardDrop || 0;
    var baseRx = Math.max(3, Math.round(maxDim * 0.2));
    var baseRy = Math.max(2, Math.round(maxDim * 0.09));

    return (
      '<g class="order-disc__slot" data-order-slot="' + slotKey + '"' +
        ' data-slot-index="' + slot.index + '"' +
        ' data-slot-center-angle="' + formatNumber(slot.centerAngle) + '"' +
        ' data-slot-x="' + formatNumber(center.x) + '"' +
        ' data-slot-y="' + formatNumber(center.y) + '"' +
        ' data-depth-view="' + formatNumber(anchor.y) + '"' +
        ' transform="translate(' + formatNumber(anchor.x) + " " + formatNumber(anchor.y) + ')">' +
        '<g class="order-disc__placard-presence">' +
          '<ellipse class="order-disc__slot-base" cx="0" cy="0"' +
            ' rx="' + formatNumber(baseRx) + '" ry="' + formatNumber(baseRy) + '"></ellipse>' +
          '<g class="order-disc__placard-rise" transform="translate(0 ' + formatNumber(drop) + ')">' +
            '<g class="order-disc__placard-body">' +
              '<image class="order-disc__slot-image" data-order-slot-image="' + slotKey + '"' +
                ' data-max-dim="' + formatNumber(maxDim) + '"' +
                ' href="' + escapeAttr(src) + '"' +
                ' opacity="0"></image>' +
            "</g>" +
          "</g>" +
        "</g>" +
      "</g>"
    );
  }

  function applyPlacardPresence(slotNode, disc) {
    var presence = slotNode && slotNode.querySelector(".order-disc__placard-presence");
    var hidden;
    var centerAngle;
    var t;
    var scale;
    var opacity;
    var blur;
    var shadowAlpha;

    if (!presence || !slotNode) {
      return;
    }

    centerAngle = parseFloat(slotNode.getAttribute("data-slot-center-angle") || "0");
    t = getPlacardPresenceT(disc, centerAngle);
    hidden = t <= 0.0001;
    scale = lerp(PLACARD_PRESENCE.minScale, PLACARD_PRESENCE.maxScale, t);
    opacity = lerp(PLACARD_PRESENCE.minOpacity, PLACARD_PRESENCE.maxOpacity, t);
    blur = lerp(PLACARD_PRESENCE.maxBlurPx, 0, t);
    shadowAlpha = 0.08 + 0.14 * t;

    presence.setAttribute("transform", "scale(" + formatNumber(scale) + ")");
    presence.setAttribute("opacity", formatNumber(opacity));

    if (hidden) {
      presence.setAttribute("visibility", "hidden");
      slotNode.setAttribute("visibility", "hidden");
      presence.style.filter = "none";
      if (disc.sectorSlots) {
        var hiddenIndex = parseInt(slotNode.getAttribute("data-slot-index") || "0", 10);
        var hiddenSlot = disc.sectorSlots[hiddenIndex];
        if (hiddenSlot) {
          ensureSlotImageMatchesState(disc, hiddenSlot, slotNode, false);
        }
      }
      return;
    }

    presence.removeAttribute("visibility");
    slotNode.removeAttribute("visibility");
    presence.style.filter =
      "blur(" + blur.toFixed(2) + "px) drop-shadow(0 3px 6px rgba(92, 75, 58, " + shadowAlpha.toFixed(2) + "))";

    if (disc.sectorSlots) {
      var visibleIndex = parseInt(slotNode.getAttribute("data-slot-index") || "0", 10);
      var visibleSlot = disc.sectorSlots[visibleIndex];
      if (visibleSlot) {
        ensureSlotImageMatchesState(disc, visibleSlot, slotNode, true);
      }
    }
  }

  function renderTopFace(disc, geometry) {
    var scaleY = geometry.ry / geometry.rx;

    if (disc.id === "cap") {
      return (
        '<g class="order-disc__surface-project" transform="translate(' + formatNumber(geometry.cx) + " " + formatNumber(geometry.cy) + ') scale(1 ' + formatNumber(scaleY) + ')">' +
          '<circle r="' + formatNumber(geometry.rx) + '" fill="' + geometry.topColor + '"></circle>' +
          '<g class="order-disc__surface-rotor" data-disc-rotor="' + disc.id + '" transform="rotate(' + formatNumber(geometry.angle) + ')">' +
            "<defs>" +
              '<clipPath id="order-cap-texture-clip">' +
                '<ellipse cx="0" cy="0" rx="' + formatNumber(geometry.rx - 2) + '" ry="' + formatNumber(geometry.rx - 2) + '"></ellipse>' +
              "</clipPath>" +
            "</defs>" +
            '<g clip-path="url(#order-cap-texture-clip)">' +
              '<image class="order-disc__cap-texture" href="' + escapeAttr(getCapTopTexture()) + '"' +
                ' x="' + formatNumber(-geometry.rx * 1.08) + '" y="' + formatNumber(-geometry.rx * 1.08) + '"' +
                ' width="' + formatNumber(geometry.rx * 2.16) + '" height="' + formatNumber(geometry.rx * 2.16) + '"' +
                ' preserveAspectRatio="xMidYMid slice"></image>' +
            "</g>" +
          "</g>" +
          '<circle r="' + formatNumber(geometry.rx - 2) + '" fill="none" stroke="#5c4b3a" stroke-opacity="0.22" stroke-width="1.2"></circle>' +
        "</g>"
      );
    }

    return (
      '<g class="order-disc__surface-project" transform="translate(' + formatNumber(geometry.cx) + " " + formatNumber(geometry.cy) + ') scale(1 ' + formatNumber(scaleY) + ')">' +
        '<circle r="' + formatNumber(geometry.rx) + '" fill="' + geometry.topColor + '"></circle>' +
        '<g class="order-disc__surface-rotor" data-disc-rotor="' + disc.id + '" transform="rotate(' + formatNumber(geometry.angle) + ')">' +
          renderSectorMarkup(disc, geometry) +
        "</g>" +
      "</g>"
    );
  }

  function renderDisc(disc, global) {
    var geometry = getDiscGeometry(disc, global);
    var scaleY = geometry.ry / geometry.rx;
    var sideBands = disc.id === "cap" ?
      renderCapSideImageBands(disc, geometry) :
      renderSideColorBands(disc, geometry);
    var capRx = Math.max(8, geometry.rx * 0.16);
    var capRy = Math.max(4, geometry.ry * 0.34);
    var centerCapMarkup = disc.id === "cap" ? "" : (
      '<g class="order-disc__hub" transform="translate(' + formatNumber(geometry.cx) + " " + formatNumber(geometry.cy) + ')">' +
        '<ellipse rx="' + formatNumber(capRx) + '" ry="' + formatNumber(capRy) + '" fill="' + geometry.capColor + '" stroke="#5c4b3a" stroke-width="1.5"></ellipse>' +
        '<ellipse rx="' + formatNumber(capRx * 0.52) + '" ry="' + formatNumber(capRy * 0.52) + '" fill="#ffffff" fill-opacity="0.66"></ellipse>' +
      "</g>"
    );

    return (
      '<g class="order-disc order-disc--' + disc.id + '" data-disc="' + disc.id + '">' +
        '<path class="order-disc__side" d="' + createSidePath(geometry) + '" fill="url(#' + geometry.sideGradientId + ')"></path>' +
        sideBands +
        '<path class="order-disc__side-outline" d="' + createSideOutlinePath(geometry) + '" fill="none" stroke="#5c4b3a" stroke-width="2.2" stroke-linejoin="round"></path>' +
        renderTopFace(disc, geometry) +
        '<ellipse class="order-disc__outline" cx="' + formatNumber(geometry.cx) + '" cy="' + formatNumber(geometry.cy) + '" rx="' + formatNumber(geometry.rx) + '" ry="' + formatNumber(geometry.ry) + '" fill="none" stroke="#5c4b3a" stroke-width="2.2"></ellipse>' +
        centerCapMarkup +
        '<g class="order-disc__hit-project" transform="translate(' + formatNumber(geometry.cx) + " " + formatNumber(geometry.cy) + ') scale(1 ' + formatNumber(scaleY) + ')">' +
          '<path class="order-disc__hit" data-disc-hit="' + disc.id + '"' +
            ' d="' + createRingPath(geometry.rx, geometry.hitInnerRadius) + '"' +
            ' fill="rgba(255,255,255,0.001)" fill-rule="evenodd"></path>' +
        "</g>" +
        '<path class="order-disc__hit-side" data-disc-hit-side="' + disc.id + '" d="' + createUpperSideHitPath(geometry) + '" fill="rgba(255,255,255,0.001)"></path>' +
      "</g>"
    );
  }

  function renderPlacardStack(state) {
    var markup = ['<g class="order-placard-stack" data-order-placard-stack>'];
    var i;

    for (i = 0; i < PLACARD_LAYER_ORDER.length; i += 1) {
      var disc = findDisc(state, PLACARD_LAYER_ORDER[i]);
      if (disc) markup.push(renderPlacardSlots(disc, state.global));
    }

    markup.push("</g>");
    return markup.join("");
  }

  function ensurePlacardLayerOrder() {
    if (!runtime || !runtime.placardStack) return;

    var i;
    for (i = 0; i < PLACARD_LAYER_ORDER.length; i += 1) {
      var bucket = runtime.placardBuckets[PLACARD_LAYER_ORDER[i]];
      if (bucket) runtime.placardStack.appendChild(bucket);
    }
  }

  function renderSvg(state) {
    var baseDisc = findDisc(state, "base");
    var baseGeo = baseDisc ? getDiscGeometry(baseDisc, state.global) : null;
    var shadowMarkup = baseGeo ?
      (
        '<ellipse cx="' + formatNumber(baseGeo.cx) + '"' +
        ' cy="' + formatNumber(baseGeo.cy + baseGeo.height + 12) + '"' +
        ' rx="' + formatNumber(baseGeo.rx + 8) + '"' +
        ' ry="' + formatNumber(Math.max(18, baseGeo.ry * 0.64)) + '"' +
        ' fill="url(#order-floor-shadow)"></ellipse>'
      ) :
      "";

    var viewBox = formatViewBox(getTurntableViewBox(state));

    return (
      '<svg class="order-turntable" data-order-svg viewBox="' + viewBox + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="椭圆转盘">' +
        "<defs>" +
          '<linearGradient id="order-base-side" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#e8dfd1"></stop>' +
            '<stop offset="100%" stop-color="#c4a882"></stop>' +
          "</linearGradient>" +
          '<linearGradient id="order-mid-side" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#f7ecec"></stop>' +
            '<stop offset="100%" stop-color="#e8dfd1"></stop>' +
          "</linearGradient>" +
          '<linearGradient id="order-top-side" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#c8d8ba"></stop>' +
            '<stop offset="100%" stop-color="#8fbc8f"></stop>' +
          "</linearGradient>" +
          '<linearGradient id="order-cap-side" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#f5d8bb"></stop>' +
            '<stop offset="100%" stop-color="#d7a773"></stop>' +
          "</linearGradient>" +
          '<radialGradient id="order-floor-shadow" cx="50%" cy="50%" r="50%">' +
            '<stop offset="0%" stop-color="#5c4b3a" stop-opacity="0.16"></stop>' +
            '<stop offset="100%" stop-color="#5c4b3a" stop-opacity="0"></stop>' +
          "</radialGradient>" +
        "</defs>" +
        shadowMarkup +
        state.discs.map(function (disc) {
          return renderDisc(disc, state.global);
        }).join("") +
        renderPlacardStack(state) +
      "</svg>"
    );
  }

  function renderIndicator(disc) {
    return (
      '<div class="order-indicator" data-disc-indicator="' + disc.id + '">' +
        '<span class="order-indicator__swatch order-indicator__swatch--' + disc.id + '"></span>' +
        '<span class="order-indicator__label">' + util.escapeHtml(disc.label) + "</span>" +
        '<span class="order-indicator__meta">' + util.escapeHtml(formatNumber(disc.autoSpeed) + "°/s") + "</span>" +
      "</div>"
    );
  }

  function render(state) {
    return (
      '<div class="order-root" data-phase="' + util.escapeHtml(state.phase) + '">' +
        '<section class="order-stage-card">' +
          '<div class="order-stage-card__head">' +
            '<p class="order-stage-card__kicker caption">点餐</p>' +
            '<h2 class="order-stage-card__title">回转式选菜</h2>' +
            '<p class="order-stage-card__desc caption">每格一道菜，拖动盘面选菜，立牌随转盘旋转。</p>' +
          "</div>" +
          '<div class="order-stage" data-order-stage>' +
            renderSvg(state) +
          "</div>" +
          '<div class="order-status">' +
            '<p class="order-status__text caption" data-order-status>正在自动转动，拖动任意可见盘面即可单独接管。</p>' +
            '<div class="order-indicators">' +
              state.discs.map(renderIndicator).join("") +
            "</div>" +
          "</div>" +
        "</section>" +
        '<section class="card order-note-card">' +
          '<div class="order-note-card__row">' +
            '<h3 class="order-note-card__title">交互说明</h3>' +
            '<p class="caption">顶盘整面可拖，中盘和底盘只在露出的环带区域响应拖动。</p>' +
          "</div>" +
          '<ul class="order-note-list">' +
            "<li>四层转盘（底盘 / 中盘 / 顶盘 / 顶柱），外观与 wmx 调参页一致。</li>" +
            "<li>每层独立角度与速度；立牌格心随扇区公转，牌身始终朝上。</li>" +
            "<li>可拖顶面环带或侧壁前缘，松手后惯性减速再恢复匀速。</li>" +
            "<li>θ 到 275° 时换菜；前缘渐显渐隐各 10°，纯实区 80°–250°。</li>" +
          "</ul>" +
        "</section>" +
      "</div>"
    );
  }

  function syncTurntableViewportFit() {
    if (!runtime || !runtime.svg || !runtime.state) return;

    var desktop = window.matchMedia(TURNTABLE_DESKTOP_MQ).matches;
    var box = desktop ?
      { x: 0, y: 0, w: VIEWBOX_WIDTH, h: VIEWBOX_HEIGHT } :
      getTurntableViewBox(runtime.state);

    runtime.svg.setAttribute(
      "preserveAspectRatio",
      desktop ? "xMidYMid meet" : "xMidYMid slice"
    );
    runtime.svg.setAttribute("viewBox", formatViewBox(box));
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

  function getPointerAngle(disc, svgPoint, global) {
    if (!disc || !svgPoint) return null;

    var geometry = getDiscGeometry(disc, global);
    var scaleY = geometry.ry / geometry.rx;
    var localX = svgPoint.x - geometry.cx;
    var localY = (svgPoint.y - geometry.cy) / scaleY;
    var radius = Math.sqrt((localX * localX) + (localY * localY));

    if (radius < Math.max(10, geometry.sectorInnerRadius * 0.32)) {
      return null;
    }

    return normalizeAngle((Math.atan2(localY, localX) * 180 / Math.PI) + 90);
  }

  function getExtendedPointerAngle(disc, svgPoint, hitType, global) {
    if (hitType === "side") {
      var geometry = getDiscGeometry(disc, global);
      var sideY = Math.max(geometry.cy, Math.min(svgPoint.y, geometry.cy + geometry.height));
      return getPointerAngle(disc, { x: svgPoint.x, y: sideY }, global);
    }

    return getPointerAngle(disc, svgPoint, global);
  }

  function updatePlacardPositions(disc) {
    if (!runtime) return;

    var bucket = runtime.placardBuckets[disc.id];
    if (!bucket) return;

    var geometry = getDiscGeometry(disc, runtime.state.global);

    bucket.querySelectorAll("[data-order-slot]").forEach(function (slotNode) {
      var localX = parseFloat(slotNode.getAttribute("data-slot-x") || "0");
      var localY = parseFloat(slotNode.getAttribute("data-slot-y") || "0");
      var anchor = getSlotPositionInViewBox(disc, localX, localY, geometry);

      slotNode.setAttribute(
        "transform",
        "translate(" + formatNumber(anchor.x) + " " + formatNumber(anchor.y) + ")"
      );
      slotNode.setAttribute("data-depth-view", formatNumber(anchor.y));

      if (disc.sectorSlots) {
        var slotIndex = parseInt(slotNode.getAttribute("data-slot-index") || "0", 10);
        var slot = disc.sectorSlots[slotIndex];
        var centerAngle = parseFloat(slotNode.getAttribute("data-slot-center-angle") || "0");
        var orbitDeg = getSlotOrbitDeg(disc, centerAngle);

        if (slot) {
          maybeCycleSlotItemAtSwapAngle(disc, slot, slotNode, orbitDeg);
        }
      }

      applyPlacardPresence(slotNode, disc);
    });
  }

  function updateSideVisuals(disc) {
    if (!runtime) return;

    var geometry = getDiscGeometry(disc, runtime.state.global);

    if (runtime.sideColorGroups && runtime.sideColorGroups[disc.id]) {
      runtime.sideColorGroups[disc.id].outerHTML = renderSideColorBands(disc, geometry);
      runtime.sideColorGroups[disc.id] = runtime.svg.querySelector('[data-side-colors="' + disc.id + '"]');
    }

    if (runtime.sideRotors && runtime.sideRotors[disc.id]) {
      runtime.sideRotors[disc.id].outerHTML = renderCapSideImageBands(disc, geometry);
      runtime.sideRotors[disc.id] = runtime.svg.querySelector('[data-side-rotor="' + disc.id + '"]');
    }
  }

  function updateRotor(disc) {
    if (!runtime) return;

    var rotate = "rotate(" + formatNumber(disc.angle) + ")";

    if (runtime.rotors[disc.id]) {
      runtime.rotors[disc.id].setAttribute("transform", rotate);
    }

    updateSideVisuals(disc);
    updatePlacardPositions(disc);
    sortPlacardDepth(disc);
    ensurePlacardLayerOrder();
  }

  function sortPlacardDepth(disc) {
    var bucket = runtime && runtime.placardBuckets[disc.id];
    if (!bucket) return;

    var slots = Array.prototype.slice.call(bucket.querySelectorAll("[data-order-slot]"));
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

    container.querySelectorAll("[data-order-slot-image]").forEach(function (imageEl) {
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
    container.querySelectorAll("[data-order-slot-image]").forEach(function (imageEl) {
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

    container.querySelectorAll("[data-order-slot-image]").forEach(function (imageEl) {
      var key = imageEl.getAttribute("data-order-slot-image");
      if (key) slotImages[key] = imageEl;
    });

    container.querySelectorAll("[data-order-slot]").forEach(function (slotEl) {
      var key = slotEl.getAttribute("data-order-slot");
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

      if (Math.abs(disc.angularVelocity || 0) > INERTIA_VELOCITY_EPS) {
        disc.angle = normalizeAngle(
          disc.angle + ((disc.angularVelocity || 0) * delta * (disc.inertiaBoost || 1))
        );
        disc.angularVelocity *= Math.pow(INERTIA_DECAY_PER_SEC, delta * 60);
      } else {
        disc.angularVelocity = 0;
        disc.angle = normalizeAngle(disc.angle + (disc.autoSpeed * delta));
      }

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

    var hit = event.target.closest("[data-disc-hit], [data-disc-hit-side]");
    if (!hit) return;

    var hitType = hit.hasAttribute("data-disc-hit-side") ? "side" : "top";
    var discId = hitType === "side" ?
      hit.getAttribute("data-disc-hit-side") :
      hit.getAttribute("data-disc-hit");
    var disc = findDisc(runtime.state, discId);
    var svgPoint = getSvgPoint(runtime, event);
    var pointerAngle = getExtendedPointerAngle(disc, svgPoint, hitType, runtime.state.global);

    if (!disc || pointerAngle == null) return;

    disc.dragging = true;
    disc.pointerId = event.pointerId;
    disc.lastPointerAngle = pointerAngle;
    disc.lastMoveTime = event.timeStamp || performance.now();
    disc.angularVelocity = 0;
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
    var hitType = runtime.activeHitTarget && runtime.activeHitTarget.hasAttribute("data-disc-hit-side") ?
      "side" :
      "top";
    var pointerAngle = getExtendedPointerAngle(disc, svgPoint, hitType, runtime.state.global);

    if (pointerAngle == null) return;

    var deltaAngle = angleDelta(pointerAngle, disc.lastPointerAngle);
    var now = event.timeStamp || performance.now();
    var elapsed = Math.max(8, now - (disc.lastMoveTime || now));

    disc.angle = normalizeAngle(disc.angle + deltaAngle);
    disc.lastPointerAngle = pointerAngle;
    disc.lastMoveTime = now;
    disc.angularVelocity = deltaAngle / (elapsed / 1000);
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
      disc.lastMoveTime = null;
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
    var stage = container.querySelector("[data-order-stage]");
    var svg = container.querySelector("[data-order-svg]");
    var statusText = container.querySelector("[data-order-status]");
    var unbinds = [];
    var indicatorMap = {};
    var rotorMap = {};
    var placardBucketMap = {};
    var sideColorMap = {};
    var sideRotorMap = {};

    DISC_IDS.forEach(function (discId) {
      var rotor = container.querySelector('[data-disc-rotor="' + discId + '"]');
      if (rotor) rotorMap[discId] = rotor;

      var placards = container.querySelector('[data-disc-placards="' + discId + '"]');
      if (placards) placardBucketMap[discId] = placards;

      var sideColors = container.querySelector('[data-side-colors="' + discId + '"]');
      if (sideColors) sideColorMap[discId] = sideColors;

      var sideRotor = container.querySelector('[data-side-rotor="' + discId + '"]');
      if (sideRotor) sideRotorMap[discId] = sideRotor;

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
      sideColorGroups: sideColorMap,
      sideRotors: sideRotorMap,
      placardStack: container.querySelector("[data-order-placard-stack]"),
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

    ensurePlacardLayerOrder();

    preloadDiscItems(state, container);
    layoutPlacardImages(container);

    unbinds.push(util.on(stage, "pointerdown", handlePointerDown));
    unbinds.push(util.on(stage, "pointermove", handlePointerMove));
    unbinds.push(util.on(stage, "pointerup", handlePointerUp));
    unbinds.push(util.on(stage, "pointercancel", handlePointerUp));
    unbinds.push(util.on(stage, "lostpointercapture", handlePointerUp));

    syncTurntableViewportFit();
    unbinds.push(util.on(window, "resize", syncTurntableViewportFit));

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
