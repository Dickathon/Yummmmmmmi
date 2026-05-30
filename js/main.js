/**
 * Yummi 应用入口 — 三栏：点餐 / 装扮 / 社交
 */
(function (global) {
  "use strict";

  var root = null;
  var currentTab = "order";

  var TAB_CONFIG = {
    order: {
      label: "点餐",
      title: "点餐",
      desc: "挑选美食，开始你的味觉旅程"
    },
    dress: {
      label: "装扮",
      title: "装扮",
      desc: "搭配造型，展现独特风格"
    },
    social: {
      label: "社交",
      title: "社交",
      desc: "与好友互动，分享美食时刻"
    }
  };

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function renderOrderPanel() {
    var foods = global.Yummi && global.Yummi.foods;
    if (!foods) {
      return '<div class="card"><p>食物数据加载中…</p></div>';
    }

    var types = Object.keys(foods.categories);
    return types.map(function (type) {
      var count = foods.getByType(type).length;
      return (
        '<div class="card">' +
          '<span class="tag tag--' + escapeHtml(type) + '">' + escapeHtml(type) + "</span>" +
          '<p style="margin-top:12px;color:var(--color-text-muted);font-size:0.875rem;">' +
            "共 " + count + " 种 · 玩法开发中" +
          "</p>" +
        "</div>"
      );
    }).join("");
  }

  function renderPanelContent(tabId) {
    var cfg = TAB_CONFIG[tabId];
    var body = "";

    if (tabId === "order") {
      body = renderOrderPanel();
    } else {
      body =
        '<div class="card">' +
          "<p>「" + escapeHtml(cfg.label) + "」模块开发中，敬请期待。</p>" +
        "</div>";
    }

    return (
      '<section class="panel" data-panel="' + escapeHtml(tabId) + '" role="tabpanel"' +
        (tabId === currentTab ? "" : ' hidden') + ">" +
        '<header class="panel-header">' +
          '<h1 class="panel-title">' + escapeHtml(cfg.title) + "</h1>" +
          '<p class="panel-desc">' + escapeHtml(cfg.desc) + "</p>" +
        "</header>" +
        '<div class="panel-body">' + body + "</div>" +
      "</section>"
    );
  }

  function renderScreens() {
    if (!root) return;
    root.innerHTML =
      Object.keys(TAB_CONFIG).map(renderPanelContent).join("");
  }

  function setActiveTab(tabId) {
    if (!TAB_CONFIG[tabId] || tabId === currentTab) return;
    currentTab = tabId;

    var panels = root.querySelectorAll(".panel");
    panels.forEach(function (panel) {
      var active = panel.getAttribute("data-panel") === tabId;
      panel.hidden = !active;
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

    var icons = tabBar.querySelectorAll(".tab-bar__icon");
    icons.forEach(function (img) {
      img.addEventListener("error", function () {
        var wrap = img.parentElement;
        if (!wrap) return;
        img.remove();
        wrap.classList.add("tab-bar__icon-wrap--fallback");
      });
    });
  }

  function init() {
    root = document.getElementById("screen-root");
    if (!root) return;
    renderScreens();
    setupTabBar();
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
