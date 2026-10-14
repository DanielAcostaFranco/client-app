"use client";

import { useEffect } from "react";

const THEME_EVENT = "vaultly-theme-change";
export const vaultlyThemeEvent = THEME_EVENT;

function applySavedTheme() {
  const savedTheme = window.localStorage.getItem("vaultly-theme");
  const isDark = savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDark ? "#0f172a" : "#ffffff");
}

export default function ThemeSync() {
  useEffect(() => {
    applySavedTheme();
    const handleThemeChange = () => applySavedTheme();
    window.addEventListener(THEME_EVENT, handleThemeChange);
    window.addEventListener("storage", handleThemeChange);
    return () => {
      window.removeEventListener(THEME_EVENT, handleThemeChange);
      window.removeEventListener("storage", handleThemeChange);
    };
  }, []);

  return null;
}
