// Collapsible Code Blocks

function extractLanguage(block) {
  const codeElement = block.querySelector("code");
  if (codeElement) {
    const dataLang = codeElement.getAttribute("data-lang");
    if (dataLang) return dataLang;
    const classList = Array.from(codeElement.classList);
    const langClass = classList.find((cls) => cls.startsWith("language-"));
    if (langClass) return langClass.replace("language-", "");
  }
  return null;
}

function capitalizeLanguage(lang) {
  if (!lang) return "";
  return lang.charAt(0).toUpperCase() + lang.slice(1);
}

function countCodeLines(block) {
  const codeElement = block.querySelector("code") || block;
  const text = codeElement.textContent || codeElement.innerText || "";
  const lines = text.split("\n");
  if (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
    lines.pop();
  }
  return lines.length;
}

/**
 * Animate collapse/expand
 */
function animateCollapse(wrapper, content, showBar, collapse) {
  if (collapse) {
    // Collapsing: measure current height, animate to 0
    const currentHeight = content.scrollHeight;
    content.style.maxHeight = currentHeight + "px";
    content.offsetHeight; // force reflow
    content.style.maxHeight = "0px";
    wrapper.classList.add("collapsed");
  } else {
    // Expanding: measure content height, animate to it, then set to 500px max
    wrapper.classList.remove("collapsed");
    const targetHeight = Math.min(content.scrollHeight, 500);
    content.style.maxHeight = "0px";
    content.offsetHeight; // force reflow
    content.style.maxHeight = targetHeight + "px";

    // After animation, set to max-height for scroll
    const onEnd = () => {
      content.style.maxHeight = "500px";
      content.removeEventListener("transitionend", onEnd);
    };
    content.addEventListener("transitionend", onEnd);
  }
}

function initCollapsibleCodeBlocks() {
  const postContent = document.querySelector(".post-content-main");
  if (!postContent) return;

  const highlightBlocks = postContent.querySelectorAll(".highlight");
  const standalonePreBlocks = Array.from(postContent.querySelectorAll("pre")).filter(
    (pre) => !pre.closest(".highlight"),
  );
  const codeBlocks = [...highlightBlocks, ...standalonePreBlocks];

  codeBlocks.forEach((block) => {
    let wrapper = block.closest(".code-block-wrapper");
    let isNewWrapper = false;

    // All code blocks are collapsible
    const isCollapsible = true;

    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";
      isNewWrapper = true;
    }

    const language = extractLanguage(block);
    const languageLabel = capitalizeLanguage(language);

    let headerBar = wrapper.querySelector(".code-block-header");

    if (!headerBar && isNewWrapper) {
      headerBar = document.createElement("div");
      headerBar.className = "code-block-header";

      if (language) {
        const langLabel = document.createElement("span");
        langLabel.className = "code-block-lang";
        langLabel.textContent = languageLabel;
        headerBar.appendChild(langLabel);
      }

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "code-block-buttons";

      // Copy button
      const copyButton = document.createElement("button");
      copyButton.className = "code-block-copy";
      copyButton.setAttribute("aria-label", "Copy code");
      copyButton.setAttribute("title", "Copy code");
      copyButton.innerHTML = `
        <svg class="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
        <svg class="checkmark-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display: none;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span class="copy-text">Copy</span>
        <span class="copied-text" style="display: none;">Copied!</span>
      `;

      copyButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        const codeElement = block.querySelector("code") || block;
        const codeText = codeElement.textContent || codeElement.innerText || "";
        try {
          await navigator.clipboard.writeText(codeText);
          const copyIcon = copyButton.querySelector(".copy-icon");
          const checkmarkIcon = copyButton.querySelector(".checkmark-icon");
          const copyText = copyButton.querySelector(".copy-text");
          const copiedText = copyButton.querySelector(".copied-text");

          copyIcon.style.display = "none";
          checkmarkIcon.style.display = "block";
          copyText.style.display = "none";
          copiedText.style.display = "inline";
          copyButton.classList.add("copied");

          setTimeout(() => {
            checkmarkIcon.style.display = "none";
            copyIcon.style.display = "block";
            copiedText.style.display = "none";
            copyText.style.display = "inline";
            copyButton.classList.remove("copied");
          }, 2000);
        } catch (err) {
          console.error("Failed to copy:", err);
        }
      });

      buttonContainer.appendChild(copyButton);

      // Toggle button
      if (isCollapsible) {
        const toggle = document.createElement("button");
        toggle.className = "code-block-toggle";
        toggle.setAttribute("aria-label", "Collapse");
        toggle.setAttribute("title", "Collapse");
        toggle.innerHTML = `
          <svg class="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          <span class="toggle-text">Collapse</span>
        `;

        toggle.addEventListener("click", () => {
          const content = wrapper.querySelector(".code-block-content");
          const showBar = wrapper.querySelector(".code-block-show");
          const isCollapsed = wrapper.classList.contains("collapsed");

          animateCollapse(wrapper, content, showBar, !isCollapsed);

          toggle.setAttribute("aria-label", isCollapsed ? "Collapse" : "Expand");
          toggle.setAttribute("title", isCollapsed ? "Collapse" : "Expand");
          const toggleText = toggle.querySelector(".toggle-text");
          if (toggleText) toggleText.textContent = isCollapsed ? "Collapse" : "Expand";
        });

        buttonContainer.appendChild(toggle);
      }

      headerBar.appendChild(buttonContainer);
      wrapper.insertBefore(headerBar, wrapper.firstChild);
    }

    if (isNewWrapper) {
      const content = document.createElement("div");
      content.className = "code-block-content";

      // Show code bar (for collapsed state)
      if (isCollapsible) {
        const showBar = document.createElement("div");
        showBar.className = "code-block-show";
        showBar.innerHTML = `
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
          </svg>
          <span>显示代码</span>
        `;

        showBar.addEventListener("click", () => {
          animateCollapse(wrapper, content, showBar, false);
          const toggle = wrapper.querySelector(".code-block-toggle");
          if (toggle) {
            toggle.setAttribute("aria-label", "Collapse");
            toggle.setAttribute("title", "Collapse");
            const toggleText = toggle.querySelector(".toggle-text");
            if (toggleText) toggleText.textContent = "Collapse";
          }
        });

        wrapper.appendChild(showBar);
      }

      block.parentNode.insertBefore(wrapper, block);
      wrapper.appendChild(content);
      content.appendChild(block);

      // Set initial max-height
      if (isCollapsible) {
        content.style.maxHeight = "500px";
      }
    }
  });
}

(function () {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCollapsibleCodeBlocks);
  } else {
    initCollapsibleCodeBlocks();
  }
})();
