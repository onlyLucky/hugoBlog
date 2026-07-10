// Collapsible Code Blocks

/**
 * Extract language from code block
 */
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

/**
 * Capitalize first letter of language name
 */
function capitalizeLanguage(lang) {
  if (!lang) return "";
  return lang.charAt(0).toUpperCase() + lang.slice(1);
}

/**
 * Count lines in code block
 */
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
 * Initialize collapsible code blocks
 */
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

    const lineCount = countCodeLines(block);
    const isCollapsible = lineCount >= 5;

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

      // Language label
      if (language) {
        const langLabel = document.createElement("span");
        langLabel.className = "code-block-lang";
        langLabel.textContent = languageLabel;
        headerBar.appendChild(langLabel);
      }

      // Button container
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

      const getCodeText = () => {
        const codeElement = block.querySelector("code") || block;
        return codeElement.textContent || codeElement.innerText || "";
      };

      copyButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        const codeText = getCodeText();
        const isMobile = window.innerWidth <= 768;

        try {
          await navigator.clipboard.writeText(codeText);
          const copyText = copyButton.querySelector(".copy-text");
          const copiedText = copyButton.querySelector(".copied-text");
          const copyIcon = copyButton.querySelector(".copy-icon");
          const checkmarkIcon = copyButton.querySelector(".checkmark-icon");

          copyButton.setAttribute("aria-label", "Code copied");
          copyButton.setAttribute("title", "Copied!");
          copyIcon.style.display = "none";
          checkmarkIcon.style.display = "block";

          if (!isMobile) {
            copyText.style.display = "none";
            copiedText.style.display = "inline";
          }
          copyButton.classList.add("copied");

          setTimeout(() => {
            checkmarkIcon.style.display = "none";
            copyIcon.style.display = "block";
            if (!isMobile) {
              copiedText.style.display = "none";
              copyText.style.display = "inline";
            }
            copyButton.classList.remove("copied");
            copyButton.setAttribute("aria-label", "Copy code");
            copyButton.setAttribute("title", "Copy code");
          }, 2000);
        } catch (err) {
          const textArea = document.createElement("textarea");
          textArea.value = codeText;
          textArea.style.position = "fixed";
          textArea.style.opacity = "0";
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand("copy");
          } catch (fallbackErr) {
            console.error("Failed to copy code:", fallbackErr);
          }
          document.body.removeChild(textArea);
        }
      });

      buttonContainer.appendChild(copyButton);

      // Toggle button - only if collapsible
      if (isCollapsible) {
        const toggle = document.createElement("button");
        toggle.className = "code-block-toggle";
        toggle.setAttribute("aria-label", "Collapse code block");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("title", "Collapse");
        toggle.innerHTML = `
          <svg class="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          <span class="toggle-text">Collapse</span>
        `;

        toggle.addEventListener("click", () => {
          const isCollapsed = wrapper.classList.contains("collapsed");
          wrapper.classList.toggle("collapsed");
          toggle.setAttribute("aria-expanded", isCollapsed);
          toggle.setAttribute("title", isCollapsed ? "Collapse" : "Expand");
          toggle.setAttribute("aria-label", isCollapsed ? "Collapse code block" : "Expand code block");
          const toggleText = toggle.querySelector(".toggle-text");
          if (toggleText) {
            toggleText.textContent = isCollapsed ? "Collapse" : "Expand";
          }
        });

        buttonContainer.appendChild(toggle);
      }

      headerBar.appendChild(buttonContainer);
      wrapper.insertBefore(headerBar, wrapper.firstChild);
    }

    if (isNewWrapper) {
      // Create content wrapper
      const content = document.createElement("div");
      content.className = "code-block-content";

      // Create "Show code" bar (visible only when collapsed)
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
          wrapper.classList.remove("collapsed");
          const toggle = wrapper.querySelector(".code-block-toggle");
          if (toggle) {
            toggle.setAttribute("aria-expanded", "true");
            toggle.setAttribute("title", "Collapse");
            const toggleText = toggle.querySelector(".toggle-text");
            if (toggleText) toggleText.textContent = "Collapse";
          }
        });

        wrapper.appendChild(showBar);
      }

      // Wrap the block
      block.parentNode.insertBefore(wrapper, block);
      wrapper.appendChild(content);
      content.appendChild(block);
    }
  });
}

// Initialize
(function () {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCollapsibleCodeBlocks);
  } else {
    initCollapsibleCodeBlocks();
  }
})();
