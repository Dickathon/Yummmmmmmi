/**
 * 食物圈 — 背景展示与栏目交互
 */
(function (global) {
  "use strict";

  var SVG_BASE = "source/svgSHOP/";

  // 店铺文件名 → SVG 文件名映射（与 shop.js 保持一致）
  function getSvgFile(shopFile) {
    var name = shopFile.replace(/^shop_/, "").replace(/\.png$/, "");
    return SVG_BASE + "interior_" + name + ".svg";
  }

  // 店铺数据（仅用于映射 SVG）
  var SHOPS = [
    { file: "shop_starbucks.png" },
    { file: "shop_mcdonalds.png" },
    { file: "shop_heytea.png" },
    { file: "shop_kfc.png" },
    { file: "shop_haidilao.png" },
    { file: "shop_mixue.png" },
    { file: "shop_luckin.png" },
    { file: "shop_burgerking.png" },
    { file: "shop_chapanda.png" },
    { file: "shop_pizzahut.png" },
    { file: "shop_nayuki.png" },
    { file: "shop_subway.png" },
    { file: "shop_alittle_tea.png" },
    { file: "shop_auntea.png" },
    { file: "shop_goodme.png" },
    { file: "shop_laoxiangji.png" }
  ];

  // 虚构消息数据
  var MESSAGES = [
    { id: 1, from: "小鹿", time: "今天 14:30", text: "嗨！今天星巴克的拿铁很好喝，推荐你试试~" },
    { id: 2, from: "阿茶", time: "昨天 20:15", text: "周末一起去吃海底捞吗？听说有新锅底~" },
    { id: 3, from: "甜甜", time: "昨天 10:22", text: "喜茶的多肉葡萄回归了！排队半小时也值得~" },
    { id: 4, from: "大胃王", time: "3天前", text: "麦当劳的薯条买一送一，别忘了去薅羊毛~" },
    { id: 5, from: "火锅仙子", time: "5天前", text: "海底捞的服务太贴心了，一个人去也不尴尬~" },
    { id: 6, from: "学生仔", time: "1周前", text: "蜜雪冰城的柠檬水涨价了，但还是最便宜的~" }
  ];

  function getLastShopIndex() {
    try {
      var raw = localStorage.getItem("yummi_last_shop");
      if (raw === null) return -1;
      var index = parseInt(raw, 10);
      if (isNaN(index) || index < 0 || index >= SHOPS.length) return -1;
      return index;
    } catch (e) {
      return -1;
    }
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // 收信箱相关
  var inboxPanel = null;
  var inboxOverlay = null;
  var inboxClose = null;
  var inboxList = null;

  function renderMessages() {
    if (!inboxList) return;
    if (MESSAGES.length === 0) {
      inboxList.innerHTML = '<p class="fc-inbox__empty">暂无消息</p>';
      return;
    }

    var html = "";
    MESSAGES.forEach(function (msg) {
      html +=
        '<div class="fc-msg" data-msg-id="' + msg.id + '">' +
          '<div class="fc-msg__header">' +
            '<span class="fc-msg__from">' + escapeHtml(msg.from) + '</span>' +
            '<span class="fc-msg__time">' + escapeHtml(msg.time) + '</span>' +
          '</div>' +
          '<p class="fc-msg__text">' + escapeHtml(msg.text) + '</p>' +
          '<div class="fc-msg__actions">' +
            '<button type="button" class="fc-msg__reply" data-msg-id="' + msg.id + '">回复</button>' +
            '<button type="button" class="fc-msg__delete" data-msg-id="' + msg.id + '">删除</button>' +
          '</div>' +
        '</div>';
    });
    inboxList.innerHTML = html;

    // 绑定回复按钮
    inboxList.querySelectorAll(".fc-msg__reply").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = parseInt(btn.getAttribute("data-msg-id"), 10);
        // TODO: 回复功能完成后在此实现
        console.log("[预留] 回复消息 id:", id);
      });
    });

    // 绑定删除按钮
    inboxList.querySelectorAll(".fc-msg__delete").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = parseInt(btn.getAttribute("data-msg-id"), 10);
        deleteMessage(id);
      });
    });
  }

  function deleteMessage(id) {
    for (var i = 0; i < MESSAGES.length; i++) {
      if (MESSAGES[i].id === id) {
        MESSAGES.splice(i, 1);
        break;
      }
    }
    renderMessages();
  }

  function openInbox() {
    if (!inboxPanel) return;
    renderMessages();
    inboxPanel.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeInbox() {
    if (!inboxPanel) return;
    inboxPanel.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function setupInbox() {
    inboxPanel = document.getElementById("fcInboxPanel");
    inboxOverlay = document.getElementById("fcInboxOverlay");
    inboxClose = document.getElementById("fcInboxClose");
    inboxList = document.getElementById("fcInboxList");

    var inboxBtn = document.getElementById("fcInbox");
    if (inboxBtn) {
      inboxBtn.addEventListener("click", openInbox);
    }

    if (inboxOverlay) inboxOverlay.addEventListener("click", closeInbox);
    if (inboxClose) inboxClose.addEventListener("click", closeInbox);

    // ESC 关闭
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && inboxPanel && inboxPanel.getAttribute("aria-hidden") === "false") {
        closeInbox();
      }
    });
  }

  function init() {
    var index = getLastShopIndex();
    var bgImg = document.getElementById("fcBgImg");

    if (index !== -1 && bgImg) {
      var shop = SHOPS[index];
      bgImg.src = getSvgFile(shop.file);
      bgImg.alt = "店铺背景";
    }

    setupInbox();

    // 其他栏目按钮 — 功能预留
    var buttons = [
      { id: "fcPreference", name: "我的偏好" },
      { id: "fcFeed", name: "投喂" }
    ];

    buttons.forEach(function (btn) {
      var el = document.getElementById(btn.id);
      if (el) {
        el.addEventListener("click", function () {
          // TODO: 功能完成后在此实现对应逻辑
          console.log("[预留] 点击栏目:", btn.name);
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);
