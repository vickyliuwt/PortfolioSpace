"use client";

// ThemeToggle.tsx
// flip light / dark, remember the choice

import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem("ps-theme", next ? "dark" : "light");
    } catch {
      // storage blocked, no big deal
    }
  };

  return (
    <button onClick={toggle} className="btn btn-cream btn-sm" aria-label="Toggle dark mode" title="Toggle dark mode">
      {dark ? (
        <>
          <FiSun /> Light
        </>
      ) : (
        <>
          <FiMoon /> Dark
        </>
      )}
    </button>
  );
}
