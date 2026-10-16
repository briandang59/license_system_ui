export type ThemePreference = "light" | "dark" | "system";

export const themeStorageKey = "license-ui-theme";
let temporaryPreference: ThemePreference | undefined;

export function parseThemePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

export function getThemeSnapshot(): string {
  let preference = temporaryPreference ?? "system";
  try {
    if (temporaryPreference === undefined) preference = parseThemePreference(localStorage.getItem(themeStorageKey));
  } catch { /* Storage can be unavailable in private or restricted browsers. */ }
  const dark = preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  return `${preference}:${dark ? "dark" : "light"}`;
}

export function subscribeTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  window.addEventListener("storage", onChange);
  window.addEventListener("license-theme-change", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("storage", onChange);
    window.removeEventListener("license-theme-change", onChange);
  };
}

export function setThemePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(themeStorageKey, preference);
    temporaryPreference = undefined;
  } catch { temporaryPreference = preference; }
  window.dispatchEvent(new Event("license-theme-change"));
}

export const getServerThemeSnapshot = () => "system:light";

// Sets the canvas before paint; dark controls wait for the matching client theme.
export const themeInitScript = `(()=>{
  let p="system";
  try { p=localStorage.getItem("${themeStorageKey}") || "system"; } catch {}
  const dark=p==="dark" || (p!=="light" && p!=="dark" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme=dark?"dark":"light";
  document.documentElement.dataset.themePending="";
})();`;
