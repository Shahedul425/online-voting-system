// src/ui/ThemeToggle.jsx
// Tiny dark/light theme toggle. Persists choice to localStorage and flips
// `html.light` class, which our CSS in index.css keys off of. No provider
// needed — reads/writes DOM + storage directly.

import { useEffect, useState } from "react";
import Icon from "./Icon";

const KEY = "ovs.theme"; // "dark" | "light"

export function initTheme() {
  // Called once from main.jsx before React renders, to avoid flash.
  try {
    const stored = localStorage.getItem(KEY);
    const prefersLight =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    const theme = stored || (prefersLight ? "light" : "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  } catch {
    /* SSR / private mode */
  }
}

function currentTheme() {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export default function ThemeToggle({ className = "", size = "sm" }) {
  const [theme, setTheme] = useState(currentTheme);

  useEffect(() => {
    // keep state in sync if someone else flips the class
    const mo = new MutationObserver(() => setTheme(currentTheme()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("light", next === "light");
    try { localStorage.setItem(KEY, next); } catch { /* noop */ }
    setTheme(next);
  };

  const isDark = theme === "dark";
  const dim = size === "sm" ? "w-9 h-9" : "w-10 h-10";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      className={`${dim} rounded-lg inline-flex items-center justify-center transition-colors ${className}`}
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        color: "var(--t1)",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-3)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--surface-2)"; }}
    >
      <Icon name={isDark ? "sun" : "moon"} className="w-4 h-4" />
    </button>
  );
}
