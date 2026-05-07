import { ThemeToggle } from "@/components/shared/providers/theme-toggle";

export default function HomePage() {
  return (
    <main
      className="
        flex min-h-screen
        items-center justify-center
        bg-background
      "
    >
      <ThemeToggle />
    </main>
  );
}
