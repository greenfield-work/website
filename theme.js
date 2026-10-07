/** Apply before styles load to avoid a flash; only the color preference is persisted. */
(() => {
  const key = "greenfield-theme";
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  /** Return light, dark, or system; default absent or unrecognized values to system. */
  const normalizeThemePreference = (value) =>
    ["light", "dark", "system"].includes(value) ? value : "system";
  let preference = "system";
  try {
    preference = normalizeThemePreference(localStorage.getItem(key));
  } catch {
    /* Storage may be blocked. */
  }
  /**
   * Resolve the current preference against the OS and update page and browser colors.
   * Synchronize the menu when present, including after DOM readiness; do not persist.
   */
  function applyThemePreference() {
    const dark =
      preference === "dark" || (preference === "system" && media.matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]').content = dark
      ? "#10231e"
      : "#f8f7f1";
    const control = document.querySelector("#theme-control");
    if (control) {
      const label = `Color theme: ${preference[0].toUpperCase()}${preference.slice(1)}`;
      const trigger = control.querySelector("summary");
      trigger.setAttribute("aria-label", label);
      trigger.title = label;
      control.querySelectorAll("[data-theme-icon]").forEach((icon) => {
        icon.hidden = icon.dataset.themeIcon !== preference;
      });
      control.querySelectorAll("[data-theme-choice]").forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.themeChoice === preference),
        );
      });
    }
  }
  applyThemePreference();
  media.addEventListener("change", applyThemePreference);
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) {
      preference = normalizeThemePreference(event.newValue);
      applyThemePreference();
    }
  });
  document.addEventListener("DOMContentLoaded", () => {
    applyThemePreference();
    const control = document.querySelector("#theme-control");
    if (!control) return;
    const trigger = control.querySelector("summary");
    control.hidden = false;
    /** Close the theme menu and, when requested, return focus to its trigger. */
    const closeThemeMenu = (restoreFocus = false) => {
      control.open = false;
      if (restoreFocus) trigger.focus();
    };
    control.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        preference = normalizeThemePreference(button.dataset.themeChoice);
        try {
          localStorage.setItem(key, preference);
        } catch {
          /* Keep the choice for this page. */
        }
        applyThemePreference();
        closeThemeMenu(true);
      });
    });
    document.addEventListener("click", (event) => {
      if (!control.contains(event.target)) closeThemeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && control.open) {
        event.preventDefault();
        closeThemeMenu(true);
      }
    });
    control.addEventListener("focusout", (event) => {
      if (!control.contains(event.relatedTarget)) closeThemeMenu();
    });
  });
})();
