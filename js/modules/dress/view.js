/**
 * 装扮模块 — 占位视图（转盘已迁至点餐模块）
 */
(function (global) {
  "use strict";

  var util = global.Yummi.util;
  var root = global.Yummi.modules.dress;

  root.view = {
    render: function (state) {
      var meta = (root.config && root.config.meta) || {};
      return (
        '<div class="dress-root dress-root--placeholder" data-phase="' + util.escapeHtml(state.phase) + '">' +
          '<section class="card">' +
            '<div class="card__head">' +
              '<span class="tag">' + util.escapeHtml(meta.label || "装扮") + "</span>" +
            "</div>" +
            '<h2 class="card__title">' + util.escapeHtml(meta.title || "装扮") + "</h2>" +
            '<p class="caption">' + util.escapeHtml(meta.desc || "宠物装扮玩法开发中") + "</p>" +
          "</section>" +
        "</div>"
      );
    },
    bind: function () {},
    unbind: function () {},
    pause: function () {},
    resume: function () {}
  };
})(typeof window !== "undefined" ? window : this);
