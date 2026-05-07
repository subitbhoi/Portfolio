"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./WaveBackground.module.css";

type Position = "fixed" | "absolute";
type ColorMode = "auto" | "light" | "dark";
type ResolvedColorMode = Exclude<ColorMode, "auto">;
type ResponsiveMetrics = {
  amplitudeScale: number;
  driftScale: number;
  glowScale: number;
  lineWidthScale: number;
  maxAmplitudeRatio: number;
  opacityScale: number;
  ribbonOverscan: number;
  ribbonScale: number;
  step: number;
  verticalSpread: number;
  wavelengthScale: number;
};
type PointerState = {
  initialized: boolean;
  influence: number;
  lastTime: number;
  lastX: number;
  lastY: number;
  targetInfluence: number;
  targetVelocityX: number;
  targetVelocityY: number;
  targetX: number;
  targetY: number;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
};
type PointerSnapshot = {
  influence: number;
  radius: number;
  strength: number;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
} | null;
type DrawOptions = {
  backgroundColors: [string, string, string];
  colors: string[];
  glow: boolean;
  intensity: number;
  opacity: number;
  pointer: PointerSnapshot;
  responsive: boolean;
  speed: number;
};

type WaveSpec = {
  amplitude: number;
  amplitudeDrift: number;
  amplitudeSpeed: number;
  colorShift: number;
  direction: -1 | 1;
  harmonic: number;
  index: number;
  lineWidth: number;
  noiseFrequency: number;
  noiseSpeed: number;
  opacity: number;
  phase: number;
  ribbonOpacity: number;
  secondaryColorShift: number;
  speed: number;
  verticalDrift: number;
  verticalPosition: number;
  wavelength: number;
  wavelengthDrift: number;
  wavelengthSpeed: number;
};

export type WaveBackgroundProps = {
  /**
   * Extra classes for the canvas. The component already fills its containing
   * block when position is "absolute", or the viewport when position is "fixed".
   */
  className?: string;
  style?: CSSProperties;
  position?: Position;
  waveCount?: number;
  speed?: number;
  intensity?: number;
  opacity?: number;
  glow?: boolean;
  responsive?: boolean;
  interactive?: boolean;
  interactionRadius?: number;
  interactionStrength?: number;
  colorMode?: ColorMode;
  colors?: string[];
  darkColors?: string[];
  backgroundColors?: [string, string, string];
  darkBackgroundColors?: [string, string, string];
  seed?: number;
};

const DEFAULT_LIGHT_COLORS = [
  "#1d4ed8",
  "#2f7bff",
  "#38bdf8",
  "#00b8d9",
  "#14b8a6",
  "#22c55e",
  "#84cc16",
  "#facc15",
  "#fb923c",
  "#ff6b6b",
  "#7c3aed",
  "#a855f7",
  "#ff4d8d",
  "#e11d48",
  "#6366f1",
  "#0ea5e9",
];

const DEFAULT_DARK_COLORS = [
  "#60a5fa",
  "#22d3ee",
  "#2dd4bf",
  "#34d399",
  "#a3e635",
  "#fde047",
  "#fb7185",
  "#f472b6",
  "#c084fc",
  "#818cf8",
  "#38bdf8",
  "#f97316",
  "#e879f9",
  "#5eead4",
  "#93c5fd",
  "#facc15",
];

const DEFAULT_LIGHT_BACKGROUND: [string, string, string] = [
  "#fbfdff",
  "#eef7ff",
  "#f7f2ff",
];
const DEFAULT_DARK_BACKGROUND: [string, string, string] = [
  "#030712",
  "#07111f",
  "#170b2e",
];
const DEFAULT_WAVE_COUNT = 12;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function finiteOr(value: number | undefined, fallback: number): number {
  return isFiniteNumber(value) ? value : fallback;
}

function optionalFinite(value: number | undefined): number | undefined {
  return isFiniteNumber(value) ? value : undefined;
}

function createPointerState(): PointerState {
  return {
    initialized: false,
    influence: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
    targetInfluence: 0,
    targetVelocityX: 0,
    targetVelocityY: 0,
    targetX: 0,
    targetY: 0,
    velocityX: 0,
    velocityY: 0,
    x: 0,
    y: 0,
  };
}

function createRandomSeed() {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0];
  }

  return Math.floor(Math.random() * 2 ** 32);
}

function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(random: () => number, min: number, max: number) {
  return min + random() * (max - min);
}

function randomInt(random: () => number, min: number, max: number) {
  return Math.floor(randomBetween(random, min, max + 1));
}

function getPointerSnapshot(
  pointer: PointerState,
  width: number,
  height: number,
  interactive: boolean,
  interactionRadius: number | undefined,
  interactionStrength: number,
): PointerSnapshot {
  if (!interactive || !pointer.initialized) {
    return null;
  }

  pointer.x += (pointer.targetX - pointer.x) * 0.16;
  pointer.y += (pointer.targetY - pointer.y) * 0.16;
  pointer.velocityX += (pointer.targetVelocityX - pointer.velocityX) * 0.16;
  pointer.velocityY += (pointer.targetVelocityY - pointer.velocityY) * 0.16;
  pointer.influence += (pointer.targetInfluence - pointer.influence) * 0.12;
  pointer.targetVelocityX *= 0.88;
  pointer.targetVelocityY *= 0.88;

  if (pointer.influence < 0.004 && pointer.targetInfluence === 0) {
    pointer.influence = 0;
    pointer.velocityX = 0;
    pointer.velocityY = 0;
    return null;
  }

  const responsiveRadius = clamp(Math.min(width, height) * 0.34, 120, 340);

  return {
    influence: pointer.influence,
    radius: interactionRadius ?? responsiveRadius,
    strength: interactionStrength,
    velocityX: pointer.velocityX,
    velocityY: pointer.velocityY,
    x: pointer.x,
    y: pointer.y,
  };
}

function getResponsiveMetrics(
  width: number,
  height: number,
  responsive: boolean,
): ResponsiveMetrics {
  const widthRatio = clamp(width / 1180, 0.44, 1.32);

  if (!responsive) {
    return {
      amplitudeScale: clamp(widthRatio, 0.74, 1.28),
      driftScale: 1,
      glowScale: 1,
      lineWidthScale: 1,
      maxAmplitudeRatio: 0.24,
      opacityScale: 1,
      ribbonOverscan: 80,
      ribbonScale: 1,
      step: clamp(width / 64, 14, 26),
      verticalSpread: 1,
      wavelengthScale: clamp(widthRatio, 0.74, 1.28),
    };
  }

  const compactWidth = clamp((560 - width) / 240, 0, 1);
  const compactHeight = clamp((680 - height) / 260, 0, 1);
  const wideScreen = clamp((width - 1280) / 720, 0, 1);
  const shortScreen = Math.max(compactWidth, compactHeight);

  return {
    amplitudeScale: clamp(
      0.72 + widthRatio * 0.36 + wideScreen * 0.1 - shortScreen * 0.22,
      0.48,
      1.32,
    ),
    driftScale: clamp(1 - shortScreen * 0.34, 0.64, 1),
    glowScale: clamp(0.72 + widthRatio * 0.24, 0.7, 1.18),
    lineWidthScale: clamp(0.72 + widthRatio * 0.28, 0.66, 1.12),
    maxAmplitudeRatio: clamp(0.24 - shortScreen * 0.08, 0.15, 0.24),
    opacityScale: clamp(1 - shortScreen * 0.16 + wideScreen * 0.08, 0.78, 1.08),
    ribbonOverscan: clamp(height * 0.1, 42, 96),
    ribbonScale: clamp(1 - shortScreen * 0.3, 0.68, 1),
    step: clamp(width / (shortScreen > 0.4 ? 44 : 64), 10, 28),
    verticalSpread: clamp(1 - shortScreen * 0.16, 0.82, 1),
    wavelengthScale: clamp(
      0.66 + widthRatio * 0.36 + compactWidth * 0.1 + wideScreen * 0.14,
      0.62,
      1.34,
    ),
  };
}

function createWave(
  index: number,
  total: number,
  random: () => number,
): WaveSpec {
  const spread = total <= 1 ? 0.5 : index / (total - 1);
  const laneJitter = randomBetween(random, -0.12, 0.12);

  return {
    amplitude: randomBetween(random, 18, 96),
    amplitudeDrift: randomBetween(random, 0.04, 0.18),
    amplitudeSpeed: randomBetween(random, 0.08, 0.26),
    colorShift: randomInt(random, 0, DEFAULT_LIGHT_COLORS.length - 1),
    direction: random() > 0.48 ? 1 : -1,
    harmonic: randomBetween(random, 0.34, 1.04),
    index,
    lineWidth: randomBetween(random, 1.1, 4.6),
    noiseFrequency: randomBetween(random, 0.0016, 0.011),
    noiseSpeed: randomBetween(random, 0.18, 0.98),
    opacity: randomBetween(random, 0.18, 0.58),
    phase: randomBetween(random, 0, Math.PI * 2),
    ribbonOpacity: randomBetween(random, 0.09, 0.19),
    secondaryColorShift: randomInt(random, 2, 8),
    speed: randomBetween(random, 0.14, 0.72),
    verticalDrift: randomBetween(random, 0.009, 0.032),
    verticalPosition: clamp(0.08 + spread * 0.84 + laneJitter, 0.08, 0.92),
    wavelength: randomBetween(random, 150, 820),
    wavelengthDrift: randomBetween(random, 0.035, 0.16),
    wavelengthSpeed: randomBetween(random, 0.06, 0.18),
  };
}

function getWaveY(
  wave: WaveSpec,
  x: number,
  time: number,
  speed: number,
  height: number,
  intensity: number,
  metrics: ResponsiveMetrics,
  pointer: PointerSnapshot,
) {
  const amplitudePulse =
    1 + Math.sin(time * wave.amplitudeSpeed + wave.phase) * wave.amplitudeDrift;
  const wavelengthPulse =
    1 +
    Math.cos(time * wave.wavelengthSpeed + wave.phase * 0.7) *
      wave.wavelengthDrift;
  const phase = wave.phase + time * wave.speed * speed * wave.direction;
  const drift =
    Math.sin(time * 0.16 + wave.phase) *
    height *
    wave.verticalDrift *
    metrics.driftScale;
  const responsivePosition =
    0.5 + (wave.verticalPosition - 0.5) * metrics.verticalSpread;
  const yBase = height * responsivePosition + drift;
  const baseAmplitude =
    wave.amplitude * amplitudePulse * metrics.amplitudeScale * intensity;
  const baseWavelength =
    wave.wavelength * wavelengthPulse * metrics.wavelengthScale;
  let interaction = 0;
  let deflection = 0;
  let phaseWarp = 0;
  let wavelengthModifier = 1;
  let xWarp = 0;

  if (pointer) {
    const radius = pointer.radius * (0.88 + (wave.index % 4) * 0.06);
    const dx = x - pointer.x;
    const dy = yBase - pointer.y;
    const xFalloff = Math.exp(-(dx * dx) / (radius * radius));
    const verticalRadius = radius * 0.72;
    const yFalloff = Math.exp(-(dy * dy) / (verticalRadius * verticalRadius));

    interaction =
      pointer.influence *
      pointer.strength *
      xFalloff *
      (0.26 + yFalloff * 0.74);

    if (interaction > 0.001) {
      const pushDirection = dy >= 0 ? 1 : -1;
      const cursorWake = clamp(pointer.velocityY * 0.12, -46, 46);
      const ripple =
        Math.sin(dx / (radius * 0.18) - time * 3.2 + wave.phase) *
        baseAmplitude *
        0.2;
      deflection =
        pushDirection * radius * 0.14 * interaction +
        cursorWake * interaction +
        ripple * interaction;
      wavelengthModifier = clamp(
        1 + Math.sin(dx / radius + wave.phase) * interaction * 0.3,
        0.66,
        1.38,
      );
      phaseWarp =
        Math.sin(dx / (radius * 0.44) + time * 1.4) * interaction * 0.95;
      xWarp = clamp(pointer.velocityX * 0.58, -52, 52) * interaction;
    }
  }

  const amplitude = clamp(
    baseAmplitude * (1 + interaction * 0.48),
    8,
    height * metrics.maxAmplitudeRatio * 1.22,
  );
  const wavelength = Math.max(90, baseWavelength * wavelengthModifier);
  const theta = ((x + xWarp) / wavelength) * Math.PI * 2 + phaseWarp;

  return (
    yBase +
    Math.sin(theta + phase) * amplitude +
    Math.sin(theta * wave.harmonic - phase * 0.74) * amplitude * 0.44 +
    Math.cos(x * wave.noiseFrequency + time * wave.noiseSpeed + wave.phase) *
      amplitude *
      0.16 +
    deflection
  );
}

function drawWavePath(
  context: CanvasRenderingContext2D,
  wave: WaveSpec,
  time: number,
  speed: number,
  width: number,
  height: number,
  intensity: number,
  metrics: ResponsiveMetrics,
  pointer: PointerSnapshot,
) {
  const step = metrics.step;
  let previousX = -step;
  let previousY = getWaveY(
    wave,
    previousX,
    time,
    speed,
    height,
    intensity,
    metrics,
    pointer,
  );

  context.beginPath();
  context.moveTo(previousX, previousY);

  for (let x = 0; x <= width + step; x += step) {
    const y = getWaveY(
      wave,
      x,
      time,
      speed,
      height,
      intensity,
      metrics,
      pointer,
    );
    const midX = (previousX + x) / 2;
    const midY = (previousY + y) / 2;
    context.quadraticCurveTo(previousX, previousY, midX, midY);
    previousX = x;
    previousY = y;
  }
}

function drawScene(
  context: CanvasRenderingContext2D,
  waves: WaveSpec[],
  width: number,
  height: number,
  options: DrawOptions,
  now: number,
) {
  const time = now * 0.001;
  const [top, middle, bottom] = options.backgroundColors;
  const metrics = getResponsiveMetrics(width, height, options.responsive);

  context.clearRect(0, 0, width, height);

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, top);
  background.addColorStop(0.48, middle);
  background.addColorStop(1, bottom);
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalCompositeOperation = "source-over";

  waves.forEach((wave) => {
    const color =
      options.colors[(wave.index + wave.colorShift) % options.colors.length];
    const nextColor =
      options.colors[
        (wave.index + wave.colorShift + wave.secondaryColorShift) %
          options.colors.length
      ];
    const accentColor =
      options.colors[
        (wave.index + wave.colorShift + wave.secondaryColorShift + 3) %
          options.colors.length
      ];
    const responsivePosition =
      0.5 + (wave.verticalPosition - 0.5) * metrics.verticalSpread;
    const y = height * responsivePosition;

    drawWavePath(
      context,
      wave,
      time,
      options.speed,
      width,
      height,
      options.intensity,
      metrics,
      options.pointer,
    );
    context.lineTo(width + 32, height + metrics.ribbonOverscan);
    context.lineTo(-32, height + metrics.ribbonOverscan);
    context.closePath();

    const ribbonTop = 160 * metrics.ribbonScale;
    const ribbonBottom = 260 * metrics.ribbonScale;
    const ribbon = context.createLinearGradient(
      0,
      y - ribbonTop,
      0,
      y + ribbonBottom,
    );
    ribbon.addColorStop(0, "rgba(255, 255, 255, 0)");
    ribbon.addColorStop(0.36, color);
    ribbon.addColorStop(0.67, nextColor);
    ribbon.addColorStop(1, "rgba(255, 255, 255, 0)");

    context.globalAlpha =
      wave.opacity *
      options.opacity *
      wave.ribbonOpacity *
      metrics.opacityScale;
    context.fillStyle = ribbon;
    context.fill();

    drawWavePath(
      context,
      wave,
      time,
      options.speed,
      width,
      height,
      options.intensity,
      metrics,
      options.pointer,
    );

    const stroke = context.createLinearGradient(0, 0, width, 0);
    stroke.addColorStop(0, color);
    stroke.addColorStop(0.5, nextColor);
    stroke.addColorStop(1, accentColor);

    context.globalAlpha = wave.opacity * options.opacity * metrics.opacityScale;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = wave.lineWidth * metrics.lineWidthScale;
    context.strokeStyle = stroke;

    if (options.glow) {
      context.shadowBlur = (16 + wave.lineWidth * 5) * metrics.glowScale;
      context.shadowColor = nextColor;
    } else {
      context.shadowBlur = 0;
    }

    context.stroke();
    context.shadowBlur = 0;
  });

  context.restore();
}

function elementTheme(element: Element | null): ResolvedColorMode | null {
  if (!element) {
    return null;
  }

  for (const attribute of ["data-theme", "data-color-mode", "data-bs-theme"]) {
    const value = element.getAttribute(attribute)?.trim().toLowerCase();

    if (value === "dark" || value === "light") {
      return value;
    }
  }

  if (element.classList.contains("dark")) {
    return "dark";
  }

  if (element.classList.contains("light")) {
    return "light";
  }

  return null;
}

function resolvePageColorMode(
  canvas: HTMLCanvasElement | null,
): ResolvedColorMode {
  const elements: Element[] = [];
  let current: Element | null = canvas;

  while (current) {
    elements.push(current);
    current = current.parentElement;
  }

  elements.push(document.documentElement, document.body);

  for (const element of new Set(elements)) {
    const mode = elementTheme(element);

    if (mode) {
      return mode;
    }
  }

  const colorScheme =
    window.getComputedStyle(document.documentElement).colorScheme ||
    window.getComputedStyle(document.body).colorScheme;

  if (colorScheme.toLowerCase().includes("dark")) {
    return "dark";
  }

  if (colorScheme.toLowerCase().includes("light")) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function WaveBackground({
  backgroundColors = DEFAULT_LIGHT_BACKGROUND,
  className,
  colorMode = "auto",
  colors = DEFAULT_LIGHT_COLORS,
  darkBackgroundColors = DEFAULT_DARK_BACKGROUND,
  darkColors = DEFAULT_DARK_COLORS,
  glow = true,
  interactive = true,
  interactionRadius,
  interactionStrength = 1,
  intensity = 1,
  opacity = 1,
  position = "fixed",
  responsive = true,
  speed = 1,
  style,
  waveCount = DEFAULT_WAVE_COUNT,
  seed,
}: WaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<PointerState>(createPointerState());
  const [resolvedColorMode, setResolvedColorMode] =
    useState<ResolvedColorMode>("light");
  const randomSeedRef = useRef<number | null>(null);

  if (randomSeedRef.current === null) {
    randomSeedRef.current = createRandomSeed();
  }

  const activeSeed = seed ?? randomSeedRef.current;
  const resolvedWaveCount = clamp(
    Math.round(finiteOr(waveCount, DEFAULT_WAVE_COUNT)),
    1,
    32,
  );
  const resolvedIntensity = clamp(finiteOr(intensity, 1), 0, 3);
  const resolvedOpacity = clamp(finiteOr(opacity, 1), 0, 1.5);
  const resolvedSpeed = clamp(finiteOr(speed, 1), -3, 3);
  const finiteInteractionRadius = optionalFinite(interactionRadius);
  const resolvedInteractionRadius =
    finiteInteractionRadius === undefined
      ? undefined
      : clamp(finiteInteractionRadius, 64, 720);
  const resolvedInteractionStrength = clamp(
    finiteOr(interactionStrength, 1),
    0,
    2,
  );
  const waves = useMemo(() => {
    const random = createSeededRandom(activeSeed);
    return Array.from({ length: resolvedWaveCount }, (_, index) =>
      createWave(index, resolvedWaveCount, random),
    );
  }, [activeSeed, resolvedWaveCount]);
  const palette = useMemo(() => {
    if (resolvedColorMode === "dark") {
      return darkColors.length > 0 ? darkColors : DEFAULT_DARK_COLORS;
    }

    return colors.length > 0 ? colors : DEFAULT_LIGHT_COLORS;
  }, [colors, darkColors, resolvedColorMode]);
  const resolvedBackgroundColors = useMemo(
    () =>
      resolvedColorMode === "dark" ? darkBackgroundColors : backgroundColors,
    [backgroundColors, darkBackgroundColors, resolvedColorMode],
  );

  useEffect(() => {
    if (colorMode !== "auto") {
      setResolvedColorMode(colorMode);
      return;
    }

    const canvas = canvasRef.current;
    const updateColorMode = () => {
      setResolvedColorMode(resolvePageColorMode(canvas));
    };
    const observer = new MutationObserver(updateColorMode);
    let current: Element | null = canvas;

    while (current) {
      observer.observe(current, {
        attributeFilter: [
          "class",
          "data-bs-theme",
          "data-color-mode",
          "data-theme",
          "style",
        ],
        attributes: true,
      });
      current = current.parentElement;
    }

    observer.observe(document.documentElement, {
      attributeFilter: [
        "class",
        "data-bs-theme",
        "data-color-mode",
        "data-theme",
        "style",
      ],
      attributes: true,
    });
    observer.observe(document.body, {
      attributeFilter: [
        "class",
        "data-bs-theme",
        "data-color-mode",
        "data-theme",
        "style",
      ],
      attributes: true,
    });

    const schemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    schemeQuery.addEventListener("change", updateColorMode);
    updateColorMode();

    return () => {
      observer.disconnect();
      schemeQuery.removeEventListener("change", updateColorMode);
    };
  }, [colorMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });

    if (!canvas || !context) {
      return;
    }

    let frameId = 0;
    let width = 1;
    let height = 1;
    const pointer = pointerRef.current;
    let reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const render = (now: number) => {
      const pointerSnapshot = getPointerSnapshot(
        pointer,
        width,
        height,
        interactive,
        resolvedInteractionRadius,
        resolvedInteractionStrength,
      );

      drawScene(
        context,
        waves,
        width,
        height,
        {
          backgroundColors: resolvedBackgroundColors,
          colors: palette,
          glow,
          intensity: resolvedIntensity,
          opacity: resolvedOpacity,
          pointer: pointerSnapshot,
          responsive,
          speed: resolvedSpeed,
        },
        now,
      );

      if (!reducedMotion) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);

      const pixelRatio = clamp(window.devicePixelRatio || 1, 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      window.cancelAnimationFrame(frameId);
      render(performance.now());
    };

    const resetPointer = () => {
      pointer.targetInfluence = 0;
      pointer.targetVelocityX = 0;
      pointer.targetVelocityY = 0;

      if (reducedMotion) {
        pointer.influence = 0;
        pointer.velocityX = 0;
        pointer.velocityY = 0;
        window.cancelAnimationFrame(frameId);
        render(performance.now());
      }
    };

    const updatePointer = (event: PointerEvent, boost = 1) => {
      if (!interactive) {
        resetPointer();
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const isInside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;

      if (!isInside) {
        resetPointer();
        return;
      }

      const now = performance.now();

      if (!pointer.initialized) {
        pointer.initialized = true;
        pointer.x = x;
        pointer.y = y;
        pointer.targetX = x;
        pointer.targetY = y;
        pointer.lastX = x;
        pointer.lastY = y;
        pointer.lastTime = now;
      }

      const deltaTime = Math.max(16, now - pointer.lastTime);
      pointer.targetVelocityX = clamp(
        ((x - pointer.lastX) / deltaTime) * 16,
        -120,
        120,
      );
      pointer.targetVelocityY = clamp(
        ((y - pointer.lastY) / deltaTime) * 16,
        -120,
        120,
      );
      pointer.targetX = x;
      pointer.targetY = y;
      pointer.targetInfluence = clamp(
        event.pointerType === "touch" ? 0.82 * boost : boost,
        0,
        1.22,
      );
      pointer.lastX = x;
      pointer.lastY = y;
      pointer.lastTime = now;

      if (reducedMotion) {
        window.cancelAnimationFrame(frameId);
        render(now);
      }
    };

    const handlePointerMove = (event: PointerEvent) => updatePointer(event);
    const handlePointerDown = (event: PointerEvent) =>
      updatePointer(event, 1.18);
    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        resetPointer();
      }
    };
    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) {
        resetPointer();
      }
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      window.cancelAnimationFrame(frameId);
      render(performance.now());
    };

    const observer =
      "ResizeObserver" in window ? new ResizeObserver(resize) : undefined;
    observer?.observe(canvas);
    window.addEventListener("resize", resize);

    if (interactive) {
      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      window.addEventListener("pointerdown", handlePointerDown, {
        passive: true,
      });
      window.addEventListener("pointerup", handlePointerUp, { passive: true });
      window.addEventListener("pointercancel", resetPointer, { passive: true });
      window.addEventListener("pointerout", handlePointerOut, {
        passive: true,
      });
      window.addEventListener("blur", resetPointer);
    } else {
      resetPointer();
    }

    motionQuery.addEventListener("change", handleMotionChange);

    resize();

    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener("resize", resize);

      if (interactive) {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerdown", handlePointerDown);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", resetPointer);
        window.removeEventListener("pointerout", handlePointerOut);
        window.removeEventListener("blur", resetPointer);
      }

      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, [
    glow,
    interactive,
    palette,
    resolvedBackgroundColors,
    resolvedIntensity,
    resolvedInteractionRadius,
    resolvedInteractionStrength,
    resolvedOpacity,
    resolvedSpeed,
    responsive,
    waves,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={[
        styles.waveBackground,
        styles[`waveBackground--${position}`],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    />
  );
}
