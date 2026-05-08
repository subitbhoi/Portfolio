import { HeroActions } from "./HeroActions";
import { HeroSocials } from "./HeroSocials";

export function HeroContent() {
  return (
    <div
      className="
        max-w-3xl
      "
    >
      <div
        className="
          mb-6
          inline-flex items-center
          rounded-full
          border border-white/10
          bg-white/5
          px-4 py-2
          text-sm
          text-foreground/70
          backdrop-blur-xl
        "
      >
        Frontend Developer • UI Engineer
      </div>

      <h1
        className="
          text-6xl
          font-semibold
          leading-[0.95]
          tracking-tight
          sm:text-7xl
          lg:text-8xl
        "
      >
        Building
        <br />
        cinematic digital
        <br />
        experiences.
      </h1>

      <p
        className="
          mt-8
          max-w-2xl
          text-lg
          leading-relaxed
          text-foreground/65
        "
      >
        I design and engineer premium frontend experiences
        with modern React ecosystems, cinematic motion systems,
        immersive interfaces, and performance-focused architecture.
      </p>

      <HeroActions />

      <HeroSocials />
    </div>
  );
}