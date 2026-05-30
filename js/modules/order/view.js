/**
 * 点餐模块 — 视图渲染（纯 DOM 字符串 + 事件绑定）
 */
(function (global) {
  "use strict";

  var util = global.Yummi.util;
  var root = global.Yummi.modules.order;
  var unbind = null;

  function render(ctx, state) {
    var foods = ctx.foods;
    if (!foods) {
      return '<div class="card order-card"><p class="caption">食物数据加载中…</p></div>';
    }

    var types = Object.keys(foods.categories);
    var cards = types.map(function (type) {
      var count = foods.getByType(type).length;
      var cardMod = type === "甜品" ? " card--甜品" : "";
      return (
        '<article class="card order-card' + cardMod + '" data-category="' + util.escapeHtml(type) + '">' +
          '<div class="card__head">' +
            '<span class="tag tag--' + util.escapeHtml(type) + '">' + util.escapeHtml(type) + "</span>" +
            '<span class="stat">' + count + "</span>" +
          "</div>" +
          '<p class="card__meta caption">共 <span class="stat">' + count +
            "</span> 种 · 玩法开发中</p>" +
        "</article>"
      );
    }).join("");

    return (
      '<div class="order-root" data-phase="' + util.escapeHtml(state.phase) + '">' +
        cards +
        '<div class="panel-actions">' +
          '<button type="button" class="btn btn--primary" data-order-action="start">开始点餐</button>' +
          '<button type="button" class="btn btn--secondary" data-order-action="browse">浏览菜单</button>' +
        "</div>" +
      "</div>"
    );
  }

  function handleClick(e, ctx, state) {
    var card = e.target.closest("[data-category]");
    if (card) {
      state.selectedCategory = card.getAttribute("data-category");
      state.phase = "browse";
      return;
    }

    var action = e.target.closest("[data-order-action]");
    if (!action) return;
    var name = action.getAttribute("data-order-action");
    if (name === "start") state.phase = "start";
    if (name === "browse") state.phase = "browse";
  }

  root.view = {
    render: render,
    bind: function (container, ctx, state) {
      unbind = util.on(container, "click", function (e) {
        handleClick(e, ctx, state);
      });
    },
    unbind: function () {
      if (unbind) unbind();
      unbind = null;
    }
  };
})(typeof window !== "undefined" ? window : this);
