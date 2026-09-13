(function () {
  var modal = document.getElementById("wechat-oa-modal");
  if (!modal) return;

  var copyTip = document.getElementById("wechat-oa-copy-tip");
  var lastFocus = null;
  var copyTimer = null;

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("wechat-oa-open");
    var closeBtn = modal.querySelector("[data-wechat-oa-close]");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("wechat-oa-open");
    if (copyTip) copyTip.hidden = true;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) resolve();
        else reject(new Error("copy failed"));
      } catch (e) {
        reject(e);
      }
    });
  }

  document.addEventListener("click", function (e) {
    var openBtn = e.target.closest("[data-wechat-oa-open]");
    if (openBtn) {
      e.preventDefault();
      openModal();
      return;
    }

    if (e.target.closest("[data-wechat-oa-close]")) {
      e.preventDefault();
      closeModal();
      return;
    }

    var copyBtn = e.target.closest("[data-wechat-oa-copy]");
    if (copyBtn) {
      e.preventDefault();
      var name = copyBtn.getAttribute("data-wechat-oa-copy") || "";
      copyText(name).then(
        function () {
          if (!copyTip) return;
          copyTip.hidden = false;
          if (copyTimer) clearTimeout(copyTimer);
          copyTimer = setTimeout(function () {
            copyTip.hidden = true;
          }, 2400);
        },
        function () {
          if (copyTip) {
            copyTip.hidden = false;
            copyTip.textContent = copyBtn.getAttribute("data-wechat-oa-copy") || "";
          }
        }
      );
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
})();
