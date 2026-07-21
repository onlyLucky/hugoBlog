// Theme Toggle functionality

const THEME_STORAGE_KEY = "theme";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";

/** Time-based theme settings */
const LIGHT_START_HOUR = 7;  /** 7:00 AM */
const LIGHT_END_HOUR = 19;   /** 7:00 PM */

/**
 * Get theme based on current time
 * @returns {string} Theme name
 */
function getTimeBasedTheme() {
  const hour = new Date().getHours();
  return (hour >= LIGHT_START_HOUR && hour < LIGHT_END_HOUR) ? THEME_LIGHT : THEME_DARK;
}

/**
 * Get initial theme from localStorage, time-based logic, or system preference
 * Priority: localStorage > time-based > system preference
 * @returns {string} Theme name
 */
function getInitialTheme() {
  /** Check if user has manually set a theme */
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme) {
    return storedTheme;
  }

  /** Use time-based theme */
  return getTimeBasedTheme();
}

/**
 * Set theme on document
 * @param {string} theme - Theme name
 */
function setTheme(theme) {
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  updateThemeToggleIcon(theme);
}

/**
 * Update theme toggle icon visibility
 * @param {string} theme - Current theme
 */
function updateThemeToggleIcon(theme) {
  // Update all theme toggle buttons (header and mobile menu)
  const themeToggles = document.querySelectorAll(".theme-toggle");
  if (!themeToggles.length) return;

  themeToggles.forEach((themeToggle) => {
    const iconSun = themeToggle.querySelector(".icon-sun");
    const iconMoon = themeToggle.querySelector(".icon-moon");

    if (theme === THEME_LIGHT) {
      iconSun?.setAttribute("style", "display: none;");
      iconMoon?.setAttribute("style", "display: block;");
    } else {
      iconSun?.setAttribute("style", "display: block;");
      iconMoon?.setAttribute("style", "display: none;");
    }
  });
}

/**
 * Toggle theme between light and dark
 */
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");
  const newTheme = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
  setTheme(newTheme);
}

/**
 * Initialize theme toggle
 */
function initThemeToggle() {
  const themeToggles = document.querySelectorAll(".theme-toggle");
  if (!themeToggles.length) return;

  // Set initial theme
  const initialTheme = getInitialTheme();
  setTheme(initialTheme);

  // Toggle theme on button click (all theme toggle buttons)
  themeToggles.forEach((themeToggle) => {
    themeToggle.addEventListener("click", toggleTheme);
  });
}

// Initialize on page load
initOnReady(initThemeToggle);
