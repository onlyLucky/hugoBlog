(function () {
  function gaReady() {
    return typeof window.gtag === "function" && window.__GA_ID__;
  }

  function track(name, params) {
    if (!gaReady()) return;
    try {
      window.gtag("event", name, params || {});
    } catch (e) {
      /* ignore */
    }
  }

  function postPath() {
    return location.pathname || "";
  }

  function isExternal(a) {
    if (!a || !a.href) return false;
    try {
      var u = new URL(a.href, location.href);
      return u.hostname && u.hostname !== location.hostname;
    } catch (e) {
      return false;
    }
  }

  /* Outbound links */
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      if (isExternal(a)) {
        track("outbound_click", {
          link_url: a.href,
          post_path: postPath(),
        });
      }
    },
    true
  );

  /* Series nav: prev/next / series links in post */
  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!el) return;
    var href = el.getAttribute("href") || "";
    var cls = el.className || "";
    if (/nav-prev|nav-next|post-series|series-link/i.test(cls) || /\/series\//i.test(href)) {
      track("series_nav", {
        from: postPath(),
        to: href,
        series: el.getAttribute("data-series") || "",
      });
    }
  });

  /* Site search */
  function bindSearch() {
    var input =
      document.querySelector("#search-input") ||
      document.querySelector('input[type="search"]') ||
      document.querySelector(".search-input");
    if (!input) return;
    var reported = false;
    function fire() {
      var q = (input.value || "").trim();
      if (!q || reported) return;
      reported = true;
      track("search_use", { query: q });
      setTimeout(function () {
        reported = false;
      }, 3000);
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") fire();
    });
    input.addEventListener("change", fire);
  }

  /* Copy code blocks */
  document.addEventListener("click", function (e) {
    var btn =
      e.target && e.target.closest
        ? e.target.closest(".copy-button, [data-copy], .code-copy-btn, button[aria-label*='opy']")
        : null;
    if (!btn) return;
    var pre = btn.closest("pre, .highlight, .code-block");
    var lang = "";
    if (pre) {
      var code = pre.querySelector("code");
      if (code) {
        var m = (code.className || "").match(/language-([\w+-]+)/);
        if (m) lang = m[1];
      }
    }
    track("copy_code", { post_path: postPath(), lang: lang || "unknown" });
  });

  /* Language switch */
  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest ? e.target.closest("a, button") : null;
    if (!el) return;
    var href = el.getAttribute("href") || "";
    var label = (el.textContent || "") + " " + (el.getAttribute("aria-label") || "");
    var isLang =
      /language-switch|lang-switch|data-lang/i.test(el.className + " " + el.id) ||
      /\/en\//i.test(href) ||
      /语言|language/i.test(label);
    if (!isLang) return;
    var from = location.pathname.indexOf("/en/") === 0 ? "en" : "zh";
    var to = /\/en\//i.test(href) ? "en" : from === "zh" ? "en" : "zh";
    track("lang_switch", { from: from, to: to });
  });

  /* Scroll depth on posts */
  function bindScrollDepth() {
    if (!/\/posts\//.test(location.pathname)) return;
    var marks = [25, 50, 75, 100];
    var sent = {};
    function onScroll() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      var pct = Math.min(100, Math.round((window.scrollY / max) * 100));
      for (var i = 0; i < marks.length; i++) {
        var m = marks[i];
        if (pct >= m && !sent[m]) {
          sent[m] = true;
          track("scroll_depth", { percent: m, post_path: postPath() });
        }
      }
      if (sent[100]) window.removeEventListener("scroll", onScroll);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* WeChat OA modal */
  document.addEventListener("click", function (e) {
    if (e.target && e.target.closest && e.target.closest("[data-wechat-oa-open]")) {
      track("wechat_oa_open", { source: "social" });
    }
    if (e.target && e.target.closest && e.target.closest("[data-wechat-oa-copy]")) {
      track("wechat_oa_copy", {});
    }
  });

  function init() {
    bindSearch();
    bindScrollDepth();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
