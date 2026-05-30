(function (global) {
  "use strict";

  var mod = global.Yummi.modules.dress;

  mod.screen = {
    create: function (ctx) {
      var state = mod.state.create();

      return {
        mount: function (container) {
          container.classList.add("dress-module");
          container.innerHTML = mod.view.render(state);
          mod.view.bind(container, ctx, state);
        },
        unmount: function (container) {
          mod.view.unbind();
          container.classList.remove("dress-module");
          container.innerHTML = "";
          mod.state.reset(state);
        },
        onShow: function () {},
        onHide: function () {}
      };
    }
  };
})(typeof window !== "undefined" ? window : this);
