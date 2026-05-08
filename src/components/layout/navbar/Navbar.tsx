import { GlassPanel } from "@/components/ui/glass";
import { ThemeToggle } from "@/components/shared/providers/theme-toggle";

import { NavbarLinks } from "./NavbarLinks";
import { NavbarLogo } from "./NavbarLogo";

export function Navbar() {
  return (
    <header
      className="
        fixed top-6 left-1/2
        z-50
        -translate-x-1/2
      "
    >
      <GlassPanel
        variant="clear"
        opacity={74}
        transparency={52}
        highlight={0}
        thickness={10}
        refraction={0}
        resizable={false}
        minHeight={50}
      >
        {/* <NavbarLogo /> */}

        <NavbarLinks />

        {/* <ThemeToggle /> */}
      </GlassPanel>
    </header>
  );
}
