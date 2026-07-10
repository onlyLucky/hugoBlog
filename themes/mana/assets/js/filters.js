// Posts Filter System

function initFilters() {
  const titleInput = document.getElementById("filter-title");
  const yearMonthSelect = document.getElementById("filter-year-month");
  const clearBtn = document.getElementById("clear-filters");
  const postsContainer = document.getElementById("posts-container");
  const tagDropdownToggle = document.getElementById("tag-dropdown-toggle");
  const tagDropdownMenu = document.getElementById("tag-dropdown-menu");
  const tagDropdownText = document.getElementById("tag-dropdown-text");
  const filterToggle = document.getElementById("filter-toggle");
  const filterFields = document.getElementById("filter-fields");
  const filteredCount = document.getElementById("filtered-count");

  if (!postsContainer) return;

  // All tag checkboxes
  const tagCheckboxes = tagDropdownMenu
    ? Array.from(tagDropdownMenu.querySelectorAll(".filter-dropdown-check"))
    : [];

  // ── Filter Collapse/Expand ──
  if (filterToggle && filterFields) {
    filterToggle.addEventListener("click", () => {
      const isExpanded = filterToggle.getAttribute("aria-expanded") === "true";
      filterToggle.setAttribute("aria-expanded", String(!isExpanded));

      if (isExpanded) {
        filterFields.classList.add("collapsed");
      } else {
        filterFields.classList.remove("collapsed");
      }
    });
  }

  // ── Tag Dropdown Toggle ──
  if (tagDropdownToggle && tagDropdownMenu) {
    tagDropdownToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = tagDropdownMenu.classList.contains("open");
      if (isOpen) {
        tagDropdownMenu.classList.remove("open");
        tagDropdownToggle.setAttribute("aria-expanded", "false");
      } else {
        tagDropdownMenu.classList.add("open");
        tagDropdownToggle.setAttribute("aria-expanded", "true");
      }
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!tagDropdownToggle.contains(e.target) && !tagDropdownMenu.contains(e.target)) {
        tagDropdownMenu.classList.remove("open");
        tagDropdownToggle.setAttribute("aria-expanded", "false");
      }
    });

    // Apply filter when checkbox changes
    tagCheckboxes.forEach((cb) => {
      cb.addEventListener("change", () => {
        updateTagText();
        applyFilters();
      });
    });
  }

  /**
   * Update the dropdown button text showing selected tags
   */
  function updateTagText() {
    const selected = tagCheckboxes.filter((cb) => cb.checked).map((cb) => cb.value);
    const total = tagCheckboxes.length;

    if (!tagDropdownText) return;

    if (selected.length === total) {
      tagDropdownText.textContent = "全部标签";
      tagDropdownText.style.color = "";
    } else if (selected.length === 0) {
      tagDropdownText.textContent = "未选择";
      tagDropdownText.style.color = "var(--text-muted)";
    } else if (selected.length <= 2) {
      tagDropdownText.textContent = selected.join(", ");
      tagDropdownText.style.color = "var(--accent-primary)";
    } else {
      tagDropdownText.textContent = `${selected.length}/${total} 标签`;
      tagDropdownText.style.color = "var(--accent-primary)";
    }
  }

  /**
   * Apply all filters
   */
  function applyFilters() {
    const titleQuery = (titleInput?.value || "").toLowerCase().trim();
    const selectedYearMonth = yearMonthSelect?.value || "";
    const selectedTags = tagCheckboxes.filter((cb) => cb.checked).map((cb) => cb.value);
    const allTagsSelected = selectedTags.length === tagCheckboxes.length;

    const postCards = postsContainer.querySelectorAll(".post-card");
    let visibleCount = 0;

    postCards.forEach((card) => {
      const cardTitle = (card.getAttribute("data-title") || "").toLowerCase();
      const cardYearMonth = card.getAttribute("data-year-month") || "";
      const cardTags = (card.getAttribute("data-tags") || "").split(",").filter(Boolean);

      const matchesTitle = !titleQuery || cardTitle.includes(titleQuery);
      const matchesDate = !selectedYearMonth || cardYearMonth === selectedYearMonth;
      const matchesTags = allTagsSelected || selectedTags.some((tag) => cardTags.includes(tag));

      if (matchesTitle && matchesDate && matchesTags) {
        card.classList.remove("hidden");
        visibleCount++;
      } else {
        card.classList.add("hidden");
      }
    });

    // Update count
    if (filteredCount) {
      filteredCount.textContent = visibleCount;
    }
  }

  // ── Event Listeners ──
  titleInput?.addEventListener("input", applyFilters);
  yearMonthSelect?.addEventListener("change", applyFilters);

  clearBtn?.addEventListener("click", () => {
    if (titleInput) titleInput.value = "";
    if (yearMonthSelect) yearMonthSelect.value = "";
    tagCheckboxes.forEach((cb) => {
      cb.checked = true;
    });
    updateTagText();
    applyFilters();
  });

  // Initialize
  updateTagText();
}

// Initialize
(function () {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFilters);
  } else {
    initFilters();
  }
})();
