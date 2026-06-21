import { create } from "zustand";

export type ThemePref = "light" | "dark" | "system";

const STORAGE_KEY = "sourdex:theme";

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Apply the resolved theme to <html> by toggling the `.dark` class. */
function applyTheme(pref: ThemePref): void {
  const dark = pref === "dark" || (pref === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

function loadPref(): ThemePref {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

interface ThemeState {
  pref: ThemePref;
  setPref: (pref: ThemePref) => void;
}

export const useTheme = create<ThemeState>((set) => ({
  pref: loadPref(),
  setPref: (pref) => {
    localStorage.setItem(STORAGE_KEY, pref);
    applyTheme(pref);
    set({ pref });
  },
}));

/** Initialize theme on boot (apply stored pref and keep `system` in sync with the OS). */
export function initTheme(): void {
  applyTheme(loadPref());
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (useTheme.getState().pref === "system") applyTheme("system");
  });
}
