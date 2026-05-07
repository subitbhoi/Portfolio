import { ThemeToggle } from "@/components/shared/providers/theme-toggle";
import { WaveBackground } from "@/components/shared/wave-background";


export default function HomePage() {
  return (
    <main
      className="
        flex min-h-screen
        items-center justify-center
        bg-background
      "
    >
      <WaveBackground />
      <ThemeToggle />
    </main>
  );
}
