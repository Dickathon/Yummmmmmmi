(function (global) {
  "use strict";

  var util = global.Yummi.util;
  var root = global.Yummi.modules.order;
  var runtime = null;

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

  var STATUS_IDLE = "正在自动转动，拖动任意可见盘面即可单独接管。底盘 / 中盘 / 顶盘各 6 格食物立牌，θ=275° 换菜。";


function formatNumber(value) {
        return Number(value.toFixed(3));
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

      function createFrontArcPath(cx, cy, rx, ry) {
        return [
          "M", formatNumber(cx - rx), formatNumber(cy),
          "A", formatNumber(rx), formatNumber(ry), 0, 0, 0, formatNumber(cx + rx), formatNumber(cy)
        ].join(" ");
      }

      function createSideBandPath(rx, ry, height, startX, endX) {
        return [
          "M", formatNumber(startX), 0,
          "L", formatNumber(startX), formatNumber(height),
          "A", formatNumber(rx), formatNumber(ry), 0, 0, 0, formatNumber(endX), formatNumber(height),
          "L", formatNumber(endX), 0,
          "Z"
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

      function renderSectorMarkup(disc, geometry) {
        if (!disc.sectorColors.length) {
          return "";
        }
        var outerRadius = geometry.rx - 6;
        var innerRadius = Math.max(geometry.sectorInnerRadius, 12);
        var sectorCount = disc.sectorColors.length;
        var step = 360 / sectorCount;
        var parts = [];
        var i;

        for (i = 0; i < sectorCount; i += 1) {
          var start = i * step;
          var end = start + step;
          parts.push(
            '<path d="' + createDonutSectorPath(innerRadius, outerRadius, start, end) + '"' +
              ' fill="' + disc.sectorColors[i] + '"' +
              ' stroke="#5c4b3a" stroke-opacity="0.12" stroke-width="1"></path>'
          );
        }

        for (i = 0; i < sectorCount; i += 1) {
          var tickOuter = polarToCartesian(outerRadius - 1, i * step);
          var tickInner = polarToCartesian(innerRadius + 6, i * step);
          parts.push(
            '<line x1="' + formatNumber(tickInner.x) + '" y1="' + formatNumber(tickInner.y) +
            '" x2="' + formatNumber(tickOuter.x) + '" y2="' + formatNumber(tickOuter.y) +
            '" stroke="#5c4b3a" stroke-opacity="0.46" stroke-width="1.4" stroke-linecap="round"></line>'
          );
        }

        parts.push(
          '<circle r="' + formatNumber(innerRadius - 2) + '" fill="none" stroke="#5c4b3a" stroke-opacity="0.18" stroke-width="1.2"></circle>'
        );
        parts.push(
          '<circle r="' + formatNumber(outerRadius - 4) + '" fill="none" stroke="#5c4b3a" stroke-opacity="0.18" stroke-width="1.2"></circle>'
        );
        parts.push(
          '<path d="' + createDonutSectorPath(innerRadius + 8, outerRadius - 14, 318, 394) +
          '" fill="rgba(255,255,255,0.34)"></path>'
        );

        return parts.join("");
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

      function normalizeFrontAngle(angle) {
        var next = normalizeAngle(angle);
        if (next < 90) next += 360;
        return next;
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
          return Math.abs(prev.start - segment.start) > 0.001 || Math.abs(prev.end - segment.end) > 0.001;
        });
      }

      function ellipsePointOnFrontArc(angleDeg, geometry, offsetY) {
        var radians = angleDeg * Math.PI / 180;
        return {
          x: geometry.rx * Math.sin(radians),
          y: -geometry.ry * Math.cos(radians) + offsetY
        };
      }

      function angleToEllipseX(angleDeg, rx) {
        var radians = angleDeg * Math.PI / 180;
        return rx * Math.sin(radians);
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

      function renderTopFace(disc, geometry) {
        var scaleY = geometry.ry / geometry.rx;

        if (disc.id === "cap") {
          return (
            '<defs>' +
              '<clipPath id="cap-texture-clip">' +
                '<ellipse cx="0" cy="0" rx="' + formatNumber(geometry.rx - 2) + '" ry="' + formatNumber(geometry.rx - 2) + '"></ellipse>' +
              "</clipPath>" +
            "</defs>" +
            '<g transform="translate(' + formatNumber(geometry.cx) + " " + formatNumber(geometry.cy) + ') scale(1 ' + formatNumber(scaleY) + ')">' +
              '<circle r="' + formatNumber(geometry.rx) + '" fill="' + geometry.topColor + '"></circle>' +
              '<g data-rotor="' + disc.id + '" transform="rotate(' + formatNumber(geometry.angle) + ')">' +
                '<g clip-path="url(#cap-texture-clip)">' +
                  '<image class="turntable-face-image" href="' + getCapTopTexture() + '" x="' + formatNumber(-geometry.rx * 1.08) + '" y="' + formatNumber(-geometry.rx * 1.08) + '" width="' + formatNumber(geometry.rx * 2.16) + '" height="' + formatNumber(geometry.rx * 2.16) + '" preserveAspectRatio="xMidYMid slice"></image>' +
                "</g>" +
              "</g>" +
              '<circle r="' + formatNumber(geometry.rx - 2) + '" fill="none" stroke="#5c4b3a" stroke-opacity="0.22" stroke-width="1.2"></circle>' +
            "</g>"
          );
        }

        return (
          '<g transform="translate(' + formatNumber(geometry.cx) + " " + formatNumber(geometry.cy) + ') scale(1 ' + formatNumber(scaleY) + ')">' +
            '<circle r="' + formatNumber(geometry.rx) + '" fill="' + geometry.topColor + '"></circle>' +
            '<g data-rotor="' + disc.id + '" transform="rotate(' + formatNumber(geometry.angle) + ')">' +
              renderSectorMarkup(disc, geometry) +
            "</g>" +
          "</g>"
        );
      }

function renderCapSideImageBands(disc, geometry) {
        var segmentCount = 6;
        var angleRanges = createSectorAngleRanges(segmentCount, geometry.angle);
        var markup = [];
        var i;

        for (i = 0; i < angleRanges.length; i += 1) {
          var visibleRanges = getVisibleSectorSegments(angleRanges[i]);
          visibleRanges.forEach(function (segment, segmentIndex) {
            var path = buildSideSectorPath(geometry, segment.start, segment.end);
            var clipId = "cap-side-segment-" + i + "-" + segmentIndex;
            var x0 = Math.min(angleToEllipseX(segment.start, geometry.rx), angleToEllipseX(segment.end, geometry.rx));
            var x1 = Math.max(angleToEllipseX(segment.start, geometry.rx), angleToEllipseX(segment.end, geometry.rx));
            var width = Math.max(2, x1 - x0);
            var imagePadding = Math.max(0, geometry.rx * 0.06 * (1 - (width / (geometry.rx * 0.9))));
            var imageX = x0 - imagePadding;
            var imageWidth = width + imagePadding * 2;

            markup.push(
              '<defs>' +
                '<clipPath id="' + clipId + '">' +
                  '<path d="' + path + '"></path>' +
                "</clipPath>" +
              '</defs>'
            );

            markup.push(
              '<g clip-path="url(#' + clipId + ')">' +
                '<image class="turntable-side-band" href="' + getCapSideImages()[i % getCapSideImages().length] + '" x="' + formatNumber(imageX - imageWidth * 0.1) + '" y="10" width="' + formatNumber(imageWidth * 1.2) + '" height="' + formatNumber(geometry.height * 1.2) + '" preserveAspectRatio="xMidYMid slice"></image>' +
              '</g>'
            );

            markup.push(
              '<path d="' + path + '" fill="none" stroke="#5c4b3a" stroke-opacity="0.22" stroke-width="0.9"></path>'
            );
          });
        }

        return '<g class="turntable-side-carousel" data-side-rotor="' + geometry.id + '" transform="translate(' + formatNumber(geometry.cx) + ' ' + formatNumber(geometry.cy) + ')">' + markup.join("") + '</g>';
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

        return '<g class="turntable-side-colors" data-side-colors="' + disc.id + '" transform="translate(' + formatNumber(geometry.cx) + ' ' + formatNumber(geometry.cy) + ')">' + markup.join("") + '</g>';
      }

      function getDiscGeometry(disc) {
    if (!runtime || !runtime.state) return null;
    var g = runtime.state.global;
        var scale = g.globalScale * disc.scale;
        var layerUnit = (disc.baseCy - 148) / 64;

        return {
          id: disc.id,
          label: disc.label,
          colorClass: disc.colorClass,
          cx: disc.baseCx + g.offsetX + disc.x,
          cy: 148 + (layerUnit * 64 * g.layerGap) + g.offsetY + disc.y,
          rx: disc.baseRx * scale,
          ry: disc.baseRy * scale * g.ellipseRatio,
          height: 42 * g.discHeight * disc.heightScale * scale * (disc.baseRx / 72),
          angle: disc.angle,
          hitInnerRadius: disc.hitInnerRadius > 0 ? disc.hitInnerRadius * scale : 0,
          sectorInnerRadius: disc.sectorInnerRadius * scale,
          topColor: disc.topColor,
          capColor: disc.capColor,
          sideGradientId: disc.sideGradientId
        };
      }

      function renderTurntable() {
        runtime.svg.innerHTML =
          '<defs>' +
            '<linearGradient id="turntable-base-side" x1="0" y1="0" x2="0" y2="1">' +
              '<stop offset="0%" stop-color="#e8dfd1"></stop>' +
              '<stop offset="100%" stop-color="#c4a882"></stop>' +
            "</linearGradient>" +
            '<linearGradient id="turntable-mid-side" x1="0" y1="0" x2="0" y2="1">' +
              '<stop offset="0%" stop-color="#f7ecec"></stop>' +
              '<stop offset="100%" stop-color="#e8dfd1"></stop>' +
            "</linearGradient>" +
            '<linearGradient id="turntable-top-side" x1="0" y1="0" x2="0" y2="1">' +
              '<stop offset="0%" stop-color="#c8d8ba"></stop>' +
              '<stop offset="100%" stop-color="#8fbc8f"></stop>' +
            "</linearGradient>" +
            '<linearGradient id="turntable-cap-side" x1="0" y1="0" x2="0" y2="1">' +
              '<stop offset="0%" stop-color="#f5d8bb"></stop>' +
              '<stop offset="100%" stop-color="#d7a773"></stop>' +
            "</linearGradient>" +
            '<radialGradient id="turntable-floor-shadow" cx="50%" cy="50%" r="50%">' +
              '<stop offset="0%" stop-color="#5c4b3a" stop-opacity="0.16"></stop>' +
              '<stop offset="100%" stop-color="#5c4b3a" stop-opacity="0"></stop>' +
            "</radialGradient>" +
          "</defs>";

        var baseGeometry = getDiscGeometry(runtime.state.discs[0]);
        runtime.svg.innerHTML +=
          '<ellipse cx="' + formatNumber(baseGeometry.cx) + '"' +
          ' cy="' + formatNumber(baseGeometry.cy + baseGeometry.height + 12) + '"' +
          ' rx="' + formatNumber(baseGeometry.rx + 8) + '"' +
          ' ry="' + formatNumber(Math.max(18, baseGeometry.ry * 0.64)) + '"' +
          ' fill="url(#turntable-floor-shadow)"></ellipse>';

        runtime.state.discs.forEach(function (disc) {
          var geometry = getDiscGeometry(disc);
          var scaleY = geometry.ry / geometry.rx;
          var capRx = Math.max(8, geometry.rx * 0.16);
          var capRy = Math.max(4, geometry.ry * 0.34);
          var centerCapMarkup = disc.id === "cap"
            ? ""
            : (
              '<g transform="translate(' + formatNumber(geometry.cx) + " " + formatNumber(geometry.cy) + ')">' +
                '<ellipse rx="' + formatNumber(capRx) + '" ry="' + formatNumber(capRy) + '" fill="' + geometry.capColor + '" stroke="#5c4b3a" stroke-width="1.5"></ellipse>' +
                '<ellipse rx="' + formatNumber(capRx * 0.52) + '" ry="' + formatNumber(capRy * 0.52) + '" fill="#ffffff" fill-opacity="0.66"></ellipse>' +
              "</g>"
            );

          runtime.svg.innerHTML +=
            '<g data-disc="' + disc.id + '">' +
              '<path d="' + createSidePath(geometry) + '" fill="url(#' + geometry.sideGradientId + ')"></path>' +
              (disc.id === "cap" ? renderCapSideImageBands(disc, geometry) : renderSideColorBands(disc, geometry)) +
              '<path d="' + createSideOutlinePath(geometry) + '" fill="none" stroke="#5c4b3a" stroke-width="2.2" stroke-linejoin="round"></path>' +
              renderTopFace(disc, geometry) +
              '<ellipse cx="' + formatNumber(geometry.cx) + '" cy="' + formatNumber(geometry.cy) + '" rx="' + formatNumber(geometry.rx) + '" ry="' + formatNumber(geometry.ry) + '" fill="none" stroke="#5c4b3a" stroke-width="2.2"></ellipse>' +
              centerCapMarkup +
              '<g transform="translate(' + formatNumber(geometry.cx) + " " + formatNumber(geometry.cy) + ') scale(1 ' + formatNumber(scaleY) + ')">' +
                '<path class="turntable-hit" data-hit="' + disc.id + '" d="' + createRingPath(geometry.rx, geometry.hitInnerRadius) + '" fill="rgba(255,255,255,0.001)" fill-rule="evenodd"></path>' +
              "</g>" +
              '<path class="turntable-hit-side" data-hit-side="' + disc.id + '" d="' + createUpperSideHitPath(geometry) + '" fill="rgba(255,255,255,0.001)"></path>' +
            "</g>";
        });

        runtime.svg.innerHTML += TurntablePlacards.renderStack(runtime.state.discs);

        runtime.state.discs.forEach(function (disc) {
          runtime.rotors[disc.id] = runtime.svg.querySelector('[data-rotor="' + disc.id + '"]');
          runtime.sideColorGroups = runtime.sideColorGroups || {};
          runtime.sideColorGroups[disc.id] = runtime.svg.querySelector('[data-side-colors="' + disc.id + '"]');
          runtime.sideRotors = runtime.sideRotors || {};
          runtime.sideRotors[disc.id] = runtime.svg.querySelector('[data-side-rotor="' + disc.id + '"]');
        });

        TurntablePlacards.afterRender(runtime.svg, runtime.state.discs);
      }

      function updateRotor(disc) {
        if (!runtime.rotors[disc.id]) return;
        runtime.rotors[disc.id].setAttribute("transform", "rotate(" + formatNumber(disc.angle) + ")");
        if (runtime.sideColorGroups && runtime.sideColorGroups[disc.id]) {
          var geometry = getDiscGeometry(disc);
          runtime.sideColorGroups[disc.id].outerHTML = renderSideColorBands(disc, geometry);
          runtime.sideColorGroups[disc.id] = runtime.svg.querySelector('[data-side-colors="' + disc.id + '"]');
        }
        if (runtime.sideRotors && runtime.sideRotors[disc.id]) {
          var sideGeometry = getDiscGeometry(disc);
          runtime.sideRotors[disc.id].outerHTML = renderCapSideImageBands(disc, sideGeometry);
          runtime.sideRotors[disc.id] = runtime.svg.querySelector('[data-side-rotor="' + disc.id + '"]');
        }

        if (disc.id !== "cap") {
          TurntablePlacards.updateDisc(disc);
        }
      }

      function updateStatus() {
        var activeDisc = runtime.state.discs.find(function (disc) {
          return disc.id === runtime.state.activeDiscId;
        }) || null;

        runtime.status.textContent = activeDisc ?
          (activeDisc.label + " 正在被拖动，松手后会继续自动旋转。") :
          "正在自动转动，拖动任意可见盘面即可单独接管。底盘 / 中盘 / 顶盘各 6 格食物立牌，θ=275° 换菜。";
      }

      function getSvgPoint(event) {
        var point = runtime.svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        var ctm = runtime.svg.getScreenCTM();
        return ctm ? point.matrixTransform(ctm.inverse()) : null;
      }

      function getDiscById(discId) {
        return runtime.state.discs.find(function (disc) {
          return disc.id === discId;
        }) || null;
      }

      function getPointerAngle(disc, svgPoint) {
        if (!disc || !svgPoint) return null;

        var geometry = getDiscGeometry(disc);
        var scaleY = geometry.ry / geometry.rx;
        var localX = svgPoint.x - geometry.cx;
        var localY = (svgPoint.y - geometry.cy) / scaleY;
        var radius = Math.sqrt((localX * localX) + (localY * localY));

        if (radius < Math.max(10, geometry.sectorInnerRadius * 0.32)) {
          return null;
        }

        return normalizeAngle((Math.atan2(localY, localX) * 180 / Math.PI) + 90);
      }

      function getExtendedPointerAngle(disc, svgPoint, hitType) {
        if (hitType === "side") {
          var geometry = getDiscGeometry(disc);
          var sideY = Math.max(geometry.cy, Math.min(svgPoint.y, geometry.cy + geometry.height));
          return getPointerAngle(disc, { x: svgPoint.x, y: sideY });
        }
        return getPointerAngle(disc, svgPoint);
      }

      function releaseDisc(pointerId) {
        runtime.state.discs.forEach(function (disc) {
          if (disc.pointerId !== pointerId) return;
          disc.dragging = false;
          disc.pointerId = null;
          disc.lastPointerAngle = null;
          disc.lastMoveTime = null;
        });
        runtime.state.activeDiscId = null;
        runtime.hitTarget = null;
        updateStatus();
      }

      function handlePointerDown(event) {
        var hit = event.target.closest("[data-hit], [data-hit-side]");
        if (!hit) return;

        var hitType = hit.hasAttribute("data-hit-side") ? "side" : "top";
        var discId = hitType === "side" ? hit.getAttribute("data-hit-side") : hit.getAttribute("data-hit");
        var disc = getDiscById(discId);
        var svgPoint = getSvgPoint(event);
        var pointerAngle = getExtendedPointerAngle(disc, svgPoint, hitType);

        if (!disc || pointerAngle == null) return;

        disc.dragging = true;
        disc.pointerId = event.pointerId;
        disc.lastPointerAngle = pointerAngle;
        disc.lastMoveTime = event.timeStamp || performance.now();
        disc.angularVelocity = 0;
        runtime.state.activeDiscId = disc.id;
        runtime.hitTarget = hit;

        if (typeof hit.setPointerCapture === "function") {
          hit.setPointerCapture(event.pointerId);
        }

        updateStatus();
        event.preventDefault();
      }

      function handlePointerMove(event) {
        var disc = runtime.state.discs.find(function (item) {
          return item.pointerId === event.pointerId && item.dragging;
        });
        if (!disc) return;

        var svgPoint = getSvgPoint(event);
        var hitType = runtime.hitTarget && runtime.hitTarget.hasAttribute("data-hit-side") ? "side" : "top";
        var pointerAngle = getExtendedPointerAngle(disc, svgPoint, hitType);
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

      function handlePointerUp(event) {
        if (runtime.hitTarget && typeof runtime.hitTarget.releasePointerCapture === "function") {
          try {
            runtime.hitTarget.releasePointerCapture(event.pointerId);
          } catch (err) {
            /* ignore */
          }
        }
        releaseDisc(event.pointerId);
      }

      function tick(timestamp) {
    if (!runtime || !runtime.running) return;
        if (!runtime.state.lastTick) {
          runtime.state.lastTick = timestamp;
        }

        var delta = Math.min((timestamp - runtime.state.lastTick) / 1000, 0.04);
        runtime.state.lastTick = timestamp;

        runtime.state.discs.forEach(function (disc) {
          if (disc.dragging) return;
          if (Math.abs(disc.angularVelocity) > 0.01) {
            disc.angle = normalizeAngle(disc.angle + (disc.angularVelocity * delta * disc.inertiaBoost));
            disc.angularVelocity *= Math.pow(0.88, delta * 60);
          } else {
            disc.angularVelocity = 0;
            disc.angle = normalizeAngle(disc.angle + (disc.autoSpeed * delta));
          }
          updateRotor(disc);
        });

        runtime.rafId = window.requestAnimationFrame(tick);
      }

  function render(state) {
    return (
      '<div class="order-root">' +
        '<section class="turntable-root" data-order-stage>' +
          '<svg class="turntable" data-order-svg viewBox="0 0 380 398" preserveAspectRatio="xMidYMid meet" role="img" aria-label="椭圆转盘"></svg>' +
          '<p class="order-status" data-order-status>' + STATUS_IDLE + '</p>' +
        '</section>' +
      '</div>'
    );
  }

  function startAnimation() {
    if (!runtime || runtime.running) return;
    runtime.running = true;
    runtime.state.lastTick = 0;
    runtime.rafId = window.requestAnimationFrame(tick);
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

  function bind(container, ctx, state) {
    var stage = container.querySelector("[data-order-stage]");
    var svg = container.querySelector("[data-order-svg]");
    var status = container.querySelector("[data-order-status]");
    var unbinds = [];

    runtime = {
      container: container,
      ctx: ctx,
      state: state,
      stage: stage,
      svg: svg,
      status: status,
      rotors: {},
      sideColorGroups: {},
      sideRotors: {},
      hitTarget: null,
      running: false,
      rafId: 0,
      unbinds: unbinds
    };

    global.TurntablePlacards.attach({
      getDiscGeometry: getDiscGeometry,
      formatNumber: formatNumber,
      normalizeAngle: normalizeAngle
    });
    global.TurntablePlacards.applyFoodToDiscs(state.discs);

    renderTurntable();
    updateStatus();

    unbinds.push(util.on(stage, "pointerdown", handlePointerDown));
    unbinds.push(util.on(stage, "pointermove", handlePointerMove));
    unbinds.push(util.on(stage, "pointerup", handlePointerUp));
    unbinds.push(util.on(stage, "pointercancel", handlePointerUp));
    unbinds.push(util.on(stage, "lostpointercapture", handlePointerUp));

    startAnimation();
  }

  function unbind() {
    if (!runtime) return;
    stopAnimation();
    runtime.unbinds.forEach(function (off) {
      if (typeof off === "function") off();
    });
    global.TurntablePlacards.reset();
    runtime = null;
  }

  root.view = {
    render: render,
    bind: bind,
    unbind: unbind,
    pause: stopAnimation,
    resume: startAnimation
  };
})(typeof window !== "undefined" ? window : this);
