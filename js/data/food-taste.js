/**
 * 食物口味 API — 查询本地口味库、计算与用户口味画像的匹配度
 * 依赖：foods.js、food-taste-db.js
 * 全局：window.Yummi.foodTaste
 */
(function (global) {
  "use strict";

  var db = global.Yummi && global.Yummi.foodTasteDb;
  var foods = global.Yummi && global.Yummi.foods;
  var axisKeys = (db && db.axisKeys) || [];

  function getRecord(name) {
    if (!db || !db.records) {
      return null;
    }
    return db.records[name] || null;
  }

  function getAll() {
    if (!db || !db.records) {
      return [];
    }
    return Object.keys(db.records).map(function (name) {
      return db.records[name];
    });
  }

  function getWithCategory(name) {
    var record = getRecord(name);
    var type = null;
    var i;
    var list;
    var cats;

    if (!record || !foods || !foods.categories) {
      return record ? { type: type, taste: record } : null;
    }

    cats = foods.categories;
    for (var cat in cats) {
      if (!Object.prototype.hasOwnProperty.call(cats, cat)) {
        continue;
      }
      list = cats[cat];
      for (i = 0; i < list.length; i += 1) {
        if (list[i] === name) {
          type = cat;
          break;
        }
      }
      if (type) {
        break;
      }
    }

    return { name: name, type: type, taste: record };
  }

  /** 默认中性口味画像（各轴 50） */
  function createNeutralProfile() {
    var profile = {};
    var i;
    for (i = 0; i < axisKeys.length; i += 1) {
      profile[axisKeys[i]] = 50;
    }
    return profile;
  }

  /**
   * 与用户口味画像的匹配分 0–100（越高越合口味）
   * profile: { sweet, salty, ... } 各轴 0–100，表示偏好强度
   */
  function matchScore(profile, name) {
    var record = getRecord(name);
    var sumSq = 0;
    var i;
    var key;
    var diff;
    var maxDist;
    var dist;

    if (!record || !profile) {
      return 0;
    }

    for (i = 0; i < axisKeys.length; i += 1) {
      key = axisKeys[i];
      diff = Number(profile[key]) - Number(record[key]);
      if (isNaN(diff)) {
        diff = 50 - Number(record[key]);
      }
      sumSq += diff * diff;
    }

    maxDist = Math.sqrt(axisKeys.length * 100 * 100);
    dist = Math.sqrt(sumSq);
    return Math.round(100 * (1 - dist / maxDist));
  }

  function rankByProfile(profile, options) {
    var list = foods && foods.getAll ? foods.getAll() : [];
    var scored = list.map(function (item) {
      return {
        name: item.name,
        type: item.type,
        score: matchScore(profile, item.name),
        taste: getRecord(item.name)
      };
    });

    scored.sort(function (a, b) {
      return b.score - a.score;
    });

    if (options && options.limit) {
      return scored.slice(0, options.limit);
    }
    return scored;
  }

  function assertCoverage() {
    var missing = [];
    var list = foods && foods.getAll ? foods.getAll() : [];
    var i;

    for (i = 0; i < list.length; i += 1) {
      if (!getRecord(list[i].name)) {
        missing.push(list[i].name);
      }
    }
    return missing;
  }

  global.Yummi = global.Yummi || {};
  global.Yummi.foodTaste = {
    axisKeys: axisKeys,
    axisLabels: db && db.axisLabels,
    get: getRecord,
    getAll: getAll,
    getWithCategory: getWithCategory,
    createNeutralProfile: createNeutralProfile,
    matchScore: matchScore,
    rankByProfile: rankByProfile,
    assertCoverage: assertCoverage
  };
})(typeof window !== "undefined" ? window : this);
