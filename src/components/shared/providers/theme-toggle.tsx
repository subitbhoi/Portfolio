"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const themes = [
  {
    label: "light",
    icon: Sun,
  },
  {
    label: "system",
    icon: Monitor,
  },
  {
    label: "dark",
    icon: Moon,
  },
] as const;

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="
        relative
        flex items-center
        gap-1
        rounded-full
        border border-border
        bg-surface/70
        p-1
        shadow-md
        backdrop-blur-2xl
      "
    >
      {themes.map((item) => {
        const Icon = item.icon;

        const active = theme === item.label;

        return (
          <button
            key={item.label}
            onClick={() => setTheme(item.label)}
            className="
              relative
              z-10
              flex h-10 w-10
              items-center justify-center
              rounded-full
              transition-colors
            "
          >
            {active && (
              <motion.div
                layoutId="theme-toggle-pill"
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30,
                }}
                className="
                  absolute inset-0
                  rounded-full
                  bg-primary
                  shadow-lg
                "
              />
            )}

            <Icon
              className={cn(
                `
                  relative z-10
                  h-4 w-4
                  transition-colors
                `,
                active ? "text-primary-foreground" : "text-muted",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
