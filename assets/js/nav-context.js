// nav-context.js — 设置文章导航上下文（合集 vs 文章列表）
// 在页面跳转前写入 sessionStorage
(function () {
  // 收集当前页面所有 post-card 的有序列表（url + title）
  function collectPostList() {
    var list = [];
    document.querySelectorAll(".post-card[data-post-url]").forEach(function (c) {
      list.push({ url: c.getAttribute("data-post-url"), title: c.getAttribute("data-title") || '' });
    });
    return list;
  }

  function setNavContext(card) {
    var s = card.getAttribute("data-series");
    var fromSeries = card.getAttribute("data-from-series") === "true";
    if (s && fromSeries) {
      sessionStorage.setItem("navContext", "SERIES");
      sessionStorage.setItem("navSeries", s);
    } else {
      sessionStorage.setItem("navContext", "ARTICLE");
      sessionStorage.removeItem("navSeries");
    }
    // 存储当前页面的文章有序列表
    sessionStorage.setItem("navList", JSON.stringify(collectPostList()));
  }

  function initNavContext() {
    // 1) 链接：mousedown 时设置 sessionStorage，click 自然导航（兼容 View Transitions）
    document.querySelectorAll(".post-card[data-post-url] a").forEach(function (link) {
      link.addEventListener("mousedown", function (e) {
        if (link.classList.contains("post-tag")) return;
        var card = link.closest(".post-card");
        if (card) setNavContext(card);
      });
    });

    // 2) 卡片非链接区域：mousedown 设置 sessionStorage 后手动跳转
    document.querySelectorAll(".post-card[data-post-url]").forEach(function (card) {
      card.addEventListener("mousedown", function (e) {
        if (e.target.closest("a")) return;
        setNavContext(card);
        window.location.href = card.getAttribute("data-post-url");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNavContext);
  } else {
    initNavContext();
  }
})();
