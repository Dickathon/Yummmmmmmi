(function (global) {
  "use strict";

  var cfg = global.Yummi.modules.dress.config;

  global.Yummi.module.define({
    id: cfg.id,
    meta: cfg.meta,
    create: function (ctx) {
      return global.Yummi.modules.dress.screen.create(ctx);
    }
  });
})(typeof window !== "undefined" ? window : this);
