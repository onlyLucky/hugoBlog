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
    // 1) 标题链接：阻止默认跳转，先设置 sessionStorage 再手动跳转
    document.querySelectorAll(".post-card[data-post-url] a").forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (link.classList.contains("post-tag")) return;
        e.preventDefault();
        e.stopPropagation();
        var card = link.closest(".post-card");
        if (card) setNavContext(card);
        window.location.href = link.getAttribute("href");
      });
    });

    // 2) 卡片非链接区域：设置 sessionStorage 后跳转
    document.querySelectorAll(".post-card[data-post-url]").forEach(function (card) {
      card.addEventListener("click", function (e) {
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
