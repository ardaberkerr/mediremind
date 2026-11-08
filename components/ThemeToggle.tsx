"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse ${className}`} />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Açık Moda Geç" : "Koyu Moda Geç"}
      aria-label="Tema Değiştir"
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200 ${
        isDark
          ? "bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700 hover:text-amber-200 shadow-sm shadow-slate-950/50"
          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs"
      } ${className}`}
    >
      {isDark ? (
        <span className="text-base animate-fadeIn" role="img" aria-label="Güneş">
          ☀️
        </span>
      ) : (
        <span className="text-base animate-fadeIn" role="img" aria-label="Ay">
          🌙
        </span>
      )}
    </button>
  );
}
