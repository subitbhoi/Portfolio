import { navigationLinks } from "@/config/navigation";

export function NavbarLinks() {
  return (
    <nav
      className="
        hidden
        items-center gap-1
        md:flex
      "
    >
      {navigationLinks.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="
            rounded-full
            px-4 py-4
            text-sm
            text-foreground/75
            transition-all duration-300
            hover:text-foreground
            hover:bg-white/20
          "
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
