(function (global) {
  "use strict";

  var util = global.Yummi.util;
  var root = global.Yummi.modules.dress;
  var unbind = null;

  function render(state) {
    return (
      '<div class="dress-root" data-phase="' + util.escapeHtml(state.phase) + '">' +
        '<div class="card dress-card">' +
          '<p class="caption">装扮玩法开发区。请在本目录 <code>view.js</code> / <code>state.js</code> 中实现。</p>' +
        "</div>" +
        '<div class="panel-actions">' +
          '<button type="button" class="btn btn--primary" data-dress-action="open">打开衣橱</button>' +
        "</div>" +
      "</div>"
    );
  }

  root.view = {
    render: render,
    bind: function (container, ctx, state) {
      unbind = util.on(container, "click", function (e) {
        var btn = e.target.closest("[data-dress-action]");
        if (!btn) return;
        state.phase = btn.getAttribute("data-dress-action") || "idle";
      });
    },
    unbind: function () {
      if (unbind) unbind();
      unbind = null;
    }
  };
})(typeof window !== "undefined" ? window : this);
