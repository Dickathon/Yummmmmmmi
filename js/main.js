/**
 * Yummi 应用入口 — 三栏：点餐 / 装扮 / 社交
 * UI 遵循 style.md
 */
(function (global) {
  "use strict";

  var root = null;
  var currentTab = "order";

  var TAB_CONFIG = {
    order: {
      label: "点餐",
      title: "点餐",
      desc: "挑选美食，像走进京都小巷里的茶室",
      heroClass: "hero--order"
    },
    dress: {
      label: "装扮",
      title: "装扮",
      desc: "搭配造型，质朴温暖的手工感",
      heroClass: "hero--dress"
    },
    social: {
      label: "社交",
      title: "社交",
      desc: "与好友分享，宁静而不打扰的相聚",
      heroClass: "hero--social"
    }
  };

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function renderHero(cfg) {
    return (
      '<header class="hero ' + escapeHtml(cfg.heroClass) + '">' +
        '<div class="hero__content">' +
          '<h1 class="panel-title">' + escapeHtml(cfg.title) + "</h1>" +
          '<p class="panel-desc caption">' + escapeHtml(cfg.desc) + "</p>" +
        "</div>" +
        '<div class="hero__visual" aria-hidden="true"></div>' +
      "</header>"
    );
  }

  function renderOrderPanel() {
    var foods = global.Yummi && global.Yummi.foods;
    if (!foods) {
      return '<div class="card"><p class="caption">食物数据加载中…</p></div>';
    }

    var types = Object.keys(foods.categories);
    return types.map(function (type) {
      var count = foods.getByType(type).length;
      var cardMod = type === "甜品" ? " card--甜品" : "";
      return (
        '<article class="card' + cardMod + '">' +
          '<div class="card__head">' +
            '<span class="tag tag--' + escapeHtml(type) + '">' + escapeHtml(type) + "</span>" +
            '<span class="stat">' + count + "</span>" +
          "</div>" +
          '<p class="card__meta caption">共 <span class="stat">' + count +
            "</span> 种 · 玩法开发中</p>" +
        "</article>"
      );
    }).join("") +
      '<div class="panel-actions">' +
        '<button type="button" class="btn btn--primary">开始点餐</button>' +
        '<button type="button" class="btn btn--secondary">浏览菜单</button>' +
      "</div>";
  }

  function renderPlaceholderPanel(cfg) {
    return (
      '<div class="card">' +
        '<p class="caption">「' + escapeHtml(cfg.label) + "」模块开发中，敬请期待。</p>" +
      "</div>" +
      '<div class="panel-actions">' +
        '<button type="button" class="btn btn--primary">即将开放</button>' +
      "</div>"
    );
  }

  function renderPanelContent(tabId) {
    var cfg = TAB_CONFIG[tabId];
    var body = tabId === "order" ? renderOrderPanel() : renderPlaceholderPanel(cfg);

    return (
      '<section class="panel" data-panel="' + escapeHtml(tabId) + '" role="tabpanel"' +
        (tabId === currentTab ? "" : " hidden") + ">" +
        renderHero(cfg) +
        '<div class="panel-body">' + body + "</div>" +
      "</section>"
    );
  }

  function renderScreens() {
    if (!root) return;
    root.innerHTML = Object.keys(TAB_CONFIG).map(renderPanelContent).join("");
  }

  function setActiveTab(tabId) {
    if (!TAB_CONFIG[tabId] || tabId === currentTab) return;
    currentTab = tabId;

    var panels = root.querySelectorAll(".panel");
    panels.forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-panel") !== tabId;
    });

    var tabs = document.querySelectorAll(".tab-bar__item");
    tabs.forEach(function (btn) {
      var active = btn.getAttribute("data-tab") === tabId;
      btn.classList.toggle("tab-bar__item--active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function setupTabBar() {
    var tabBar = document.getElementById("tab-bar");
    if (!tabBar) return;

    tabBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".tab-bar__item");
      if (!btn) return;
      var tabId = btn.getAttribute("data-tab");
      if (tabId) setActiveTab(tabId);
    });

    tabBar.querySelectorAll(".tab-bar__icon").forEach(function (img) {
      img.addEventListener("error", function () {
        var wrap = img.parentElement;
        if (!wrap) return;
        img.remove();
        wrap.classList.add("tab-bar__icon-wrap--fallback");
      });
    });
  }

  function setupScrollNav() {
    var tabBar = document.getElementById("tab-bar");
    if (!tabBar) return;

    function onScroll() {
      var scrolled = (window.scrollY || document.documentElement.scrollTop) > 8;
      tabBar.classList.toggle("tab-bar--scrolled", scrolled);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function init() {
    root = document.getElementById("screen-root");
    if (!root) return;
    renderScreens();
    setupTabBar();
    setupScrollNav();
  }

  global.Yummi = global.Yummi || {};
  global.Yummi.app = {
    init: init,
    setActiveTab: setActiveTab,
    TAB_CONFIG: TAB_CONFIG
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);
