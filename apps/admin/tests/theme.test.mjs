import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function createTheme({ stored = null, dark = false, blocked = false } = {}) {
  const window = new EventTarget();
  const media = new EventTarget();
  media.matches = dark;
  window.matchMedia = () => media;
  const localStorage = {
    getItem: () => { if (blocked) throw new Error("Storage blocked"); return stored; },
    setItem: (_, value) => { if (blocked) throw new Error("Storage blocked"); stored = value; },
  };
  const compiled = { exports: {} };
  const document = { documentElement: { dataset: {} } };
  const sandbox = { module: compiled, exports: compiled.exports, window, localStorage, Event, document, matchMedia: window.matchMedia };
  const source = ts.transpileModule(readFileSync("lib/theme.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, sandbox);
  return { ...compiled.exports, media, window, sandbox, document, setStored: (value) => { stored = value; } };
}

test("theme: System follows OS; explicit choices persist and override OS", () => {
  const theme = createTheme({ dark: true });
  assert.equal(theme.getServerThemeSnapshot(), "system:light");
  assert.equal(theme.getThemeSnapshot(), "system:dark");
  theme.setThemePreference("light");
  assert.equal(theme.getThemeSnapshot(), "light:light");
  theme.setThemePreference("dark");
  theme.media.matches = false;
  assert.equal(theme.getThemeSnapshot(), "dark:dark");
  theme.setThemePreference("system");
  assert.equal(theme.getThemeSnapshot(), "system:light");
  theme.setStored("unknown");
  assert.equal(theme.getThemeSnapshot(), "system:light");
  theme.setStored(null);
  assert.equal(theme.getThemeSnapshot(), "system:light");
});

test("theme: blocked storage still permits switching for the current tab", () => {
  const theme = createTheme({ dark: true, blocked: true });
  assert.equal(theme.getThemeSnapshot(), "system:dark");
  theme.setThemePreference("light");
  assert.equal(theme.getThemeSnapshot(), "light:light");
  theme.setThemePreference("dark");
  assert.equal(theme.getThemeSnapshot(), "dark:dark");
});

test("theme: OS changes, cross-tab changes and selections notify subscribers; cleanup removes listeners", () => {
  const theme = createTheme();
  let changes = 0;
  const unsubscribe = theme.subscribeTheme(() => changes++);
  theme.media.dispatchEvent(new Event("change"));
  theme.window.dispatchEvent(new Event("storage"));
  theme.setThemePreference("dark");
  assert.equal(changes, 3);
  unsubscribe();
  theme.media.dispatchEvent(new Event("change"));
  theme.window.dispatchEvent(new Event("storage"));
  theme.setThemePreference("light");
  assert.equal(changes, 3);
});

test("theme: pre-paint initialization matches the hydrated snapshot, including invalid or blocked storage", () => {
  for (const options of [
    { stored: "dark" }, { stored: "light", dark: true }, { dark: true },
    { stored: "system", dark: true }, { stored: "invalid", dark: true }, { blocked: true, dark: true },
  ]) {
    const theme = createTheme(options);
    runInNewContext(theme.themeInitScript, theme.sandbox);
    assert.equal(theme.document.documentElement.dataset.theme, theme.getThemeSnapshot().split(":")[1]);
    assert.equal(theme.document.documentElement.dataset.themePending, "");
  }
});
