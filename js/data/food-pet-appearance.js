/**
 * 食物 → 宠物形象（预留接口，暂未实现真实拼合）
 *
 * 以用户第一选择（选菜列表首项）为基准解析宠物形象描述；
 * 后续装扮模块接入后在此返回各部件路径与合成参数。
 *
 * 全局：window.Yummi.foodPetAppearance
 */
(function (global) {
  "use strict";

  function trimName(name) {
    return String(name || "").trim();
  }

  /**
   * 由主选食物解析宠物形象（占位）
   * @param {string} primaryFoodName 用户第一选择
   * @returns {{
   *   ok: boolean,
   *   foodName?: string,
   *   ready?: boolean,
   *   placeholder?: { label: string, message: string },
   *   components?: null,
   *   error?: string
   * }}
   */
  function resolveFromFood(primaryFoodName) {
    var name = trimName(primaryFoodName);

    if (!name) {
      return { ok: false, error: "empty_food" };
    }

    return {
      ok: true,
      foodName: name,
      ready: false,
      components: null,
      placeholder: {
        label: name,
        message: "宠物形象即将呈现"
      }
    };
  }

  global.Yummi = global.Yummi || {};
  global.Yummi.foodPetAppearance = {
    resolveFromFood: resolveFromFood
  };
})(typeof window !== "undefined" ? window : this);
