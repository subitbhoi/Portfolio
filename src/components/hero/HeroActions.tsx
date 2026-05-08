import { ArrowRight } from "lucide-react";

import { GlassPanel } from "@/components/ui/glass";

export function HeroActions() {
  return (
    <div
      className="
        mt-10
        flex flex-wrap items-center
        gap-4
      "
    >
      <GlassPanel
        variant="prominent"
        intensity={0.45}
        colorMode="auto"
        resizable={false}
        className="
          rounded-full
        "
      >
        <button
          className="
            flex items-center gap-2
            px-6 py-3
            text-sm font-medium
            transition-transform duration-300
            hover:scale-[1.02]
          "
        >
          View Projects

          <ArrowRight className="h-4 w-4" />
        </button>
      </GlassPanel>

      <button
        className="
          rounded-full
          border border-white/10
          bg-white/5
          px-6 py-3
          text-sm
          text-foreground/80
          backdrop-blur-xl
          transition-all duration-300
          hover:bg-white/10
        "
      >
        Contact Me
      </button>
    </div>
  );
}