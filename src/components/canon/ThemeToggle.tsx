"use client";

import { CONTROL_CLASS } from "@/constants/canon/ui";
import { useTheme } from "@/hooks/canon/use-theme";
import { cn } from "@/utils/cn";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={cn(CONTROL_CLASS, "w-9 px-0 text-center sm:w-7")}
      onClick={toggleTheme}
      type="button"
    >
      <span aria-hidden="true">{theme === "dark" ? "◐" : "◑"}</span>
    </button>
  );
}
