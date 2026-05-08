"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/glass";

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
    <GlassPanel
      variant="clear"
      opacity={74}
      transparency={52}
      highlight={0}
      thickness={10}
      refraction={0}
      resizable={false}
      className="
    relative
    flex items-center
    gap-2
    rounded-full
    
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
              transition-all
              duration-300
              hover:scale-[1.03]
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
                  bg-primary/90
                  backdrop-blur-xl
                  shadow-[0_0_24px_rgba(56,189,248,0.28)]                  
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
                active ? "text-primary-foreground" : "text-foreground/55",
              )}
            />
          </button>
        );
      })}
    </GlassPanel>
  );
}
