// Scroll to Top functionality
// Constants are imported from common/constants.js

/**
 * Update the progress ring based on scroll position
 */
function updateScrollProgress() {
  const scrollToTopBtn = document.getElementById("scroll-to-top");
  if (!scrollToTopBtn) return;

  const progressFill = scrollToTopBtn.querySelector(".progress-fill");
  if (!progressFill) return;

  // Calculate scroll progress (0 to 1)
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;

  // Update stroke-dashoffset (circumference = 2 * π * 22 ≈ 138.2)
  const circumference = 138.2;
  const offset = circumference - (progress * circumference);
  progressFill.style.strokeDashoffset = offset;
}

/**
 * Toggle scroll button visibility
 */
function toggleScrollButton() {
  const scrollToTopBtn = document.getElementById("scroll-to-top");
  if (!scrollToTopBtn) return;

  if (window.scrollY > SCROLL_THRESHOLD) {
    if (!scrollToTopBtn.classList.contains("visible")) {
      scrollToTopBtn.classList.add("visible");
      scrollToTopBtn.classList.add("just-appeared");
      // Remove pulse class after animation
      setTimeout(() => scrollToTopBtn.classList.remove("just-appeared"), 600);
    }
  } else {
    scrollToTopBtn.classList.remove("visible");
  }

  updateScrollProgress();
}

/**
 * Scroll to top of page
 */
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/**
 * Initialize scroll to top functionality
 */
function initScrollToTop() {
  const scrollToTopBtn = document.getElementById("scroll-to-top");
  if (!scrollToTopBtn) return;

  window.addEventListener("scroll", toggleScrollButton, { passive: true });
  scrollToTopBtn.addEventListener("click", scrollToTop);

  // Initial state
  updateScrollProgress();
}

// Initialize on page load
(function () {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollToTop);
  } else {
    initScrollToTop();
  }
})();
