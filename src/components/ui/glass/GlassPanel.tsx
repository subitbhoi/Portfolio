"use client";

import "./glass.css";
import { type CSSProperties, type ReactNode, useEffect, useMemo } from "react";
import {
  liquidGlassDefaultColorMode,
  liquidGlassDefaultIntensity,
  liquidGlassDefaultVariant,
  liquidGlassVariantTuning,
  normalizeLiquidGlassColorMode,
  normalizeLiquidGlassIntensity,
  normalizeLiquidGlassValues,
  normalizeLiquidGlassVariant,
  type LiquidGlassColorMode,
  type LiquidGlassValues,
  type LiquidGlassVariant,
} from "./glass-config";

type GlassSize = number | string;

type LegacyLiquidGlassProps = {
  /**
   * Deprecated compatibility alias. Prefer `noise`; distortion is mapped to
   * the calmer material texture instead of a visible wave simulation.
   */
  distortion?: number;
  /** Deprecated compatibility prop. The default effect no longer uses waves. */
  distortionScale?: number;
};

export type LiquidGlassContainerProps = Partial<LiquidGlassValues> &
  LegacyLiquidGlassProps & {
    children: ReactNode;
    className?: string;
    effectLayer?: ReactNode;
    variant?: LiquidGlassVariant;
    colorMode?: LiquidGlassColorMode;
    intensity?: number;
    resizable?: boolean;
    minWidth?: GlassSize;
    minHeight?: GlassSize;
    maxWidth?: GlassSize;
    maxHeight?: GlassSize;
    onValuesChange?: (values: LiquidGlassValues) => void;
  };

type LiquidGlassStyle = CSSProperties & {
  "--glass-fill-alpha": string;
  "--glass-tint-alpha": string;
  "--glass-edge-alpha": string;
  "--glass-rim-alpha": string;
  "--glass-highlight-alpha": string;
  "--glass-glint-alpha": string;
  "--glass-noise-alpha": string;
  "--glass-protection-alpha": string;
  "--glass-caustic-alpha": string;
  "--glass-lens-alpha": string;
  "--glass-lens-depth-alpha": string;
  "--glass-blur": string;
  "--glass-saturation": string;
  "--glass-contrast": string;
  "--glass-shadow-alpha": string;
  "--glass-thickness": string;
  "--glass-border-width": string;
  "--glass-edge-width": string;
  "--glass-edge-blur": string;
  "--glass-refraction-shift": string;
  "--glass-refraction-shift-negative": string;
  "--glass-chroma-shift": string;
  "--glass-min-width"?: string;
  "--glass-min-height"?: string;
  "--glass-max-width"?: string;
  "--glass-max-height"?: string;
};

const clamp = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
};

const toCssSize = (value: GlassSize | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "number" ? `${value}px` : value;
};

export function GlassPanel({
  children,
  className,
  effectLayer,
  variant = liquidGlassDefaultVariant,
  colorMode = liquidGlassDefaultColorMode,
  intensity = liquidGlassDefaultIntensity,
  resizable = true,
  minWidth,
  minHeight,
  maxWidth = "100%",
  maxHeight,
  onValuesChange,
  opacity,
  transparency,
  blur,
  thickness,
  refraction,
  highlight,
  tint,
  noise,
  distortion,
  chromaticAberration,
  contrastProtection,
}: LiquidGlassContainerProps) {
  const materialVariant = useMemo(
    () => normalizeLiquidGlassVariant(variant),
    [variant],
  );
  const materialColorMode = useMemo(
    () => normalizeLiquidGlassColorMode(colorMode),
    [colorMode],
  );
  const materialIntensity = useMemo(
    () => normalizeLiquidGlassIntensity(intensity),
    [intensity],
  );

  const values = useMemo(
    () =>
      normalizeLiquidGlassValues({
        opacity,
        transparency,
        blur,
        thickness,
        refraction,
        highlight,
        tint,
        noise: noise ?? distortion,
        chromaticAberration,
        contrastProtection,
      }),
    [
      opacity,
      transparency,
      blur,
      thickness,
      refraction,
      highlight,
      tint,
      noise,
      distortion,
      chromaticAberration,
      contrastProtection,
    ],
  );

  useEffect(() => {
    onValuesChange?.(values);
  }, [onValuesChange, values]);

  const style = useMemo<LiquidGlassStyle>(() => {
    const tuning = liquidGlassVariantTuning[materialVariant];
    const intensityScale = 0.72 + materialIntensity * 0.48;
    const transparencyDamping = 1 - values.transparency * 0.26;
    const thicknessRatio = clamp(values.thickness / 16, 0.125, 2.25);
    const thicknessNorm = clamp((values.thickness - 2) / 34, 0, 1);
    const lensPower =
      values.refraction *
      (0.72 + thicknessRatio * 0.74) *
      (0.84 + materialIntensity * 0.32);

    const fillAlpha = clamp(
      (0.24 -
        values.transparency * 0.12 +
        values.opacity * 0.1 +
        values.contrastProtection * 0.08 +
        thicknessNorm * 0.045) *
        values.opacity *
        tuning.fill *
        intensityScale,
      0.035,
      0.62,
    );
    const tintAlpha = clamp(
      (0.04 +
        values.tint * 0.15 +
        materialIntensity * 0.035 +
        thicknessNorm * 0.04) *
        values.opacity *
        tuning.tint *
        transparencyDamping,
      0.012,
      0.3,
    );
    const edgeAlpha = clamp(
      (0.32 + values.refraction * 0.36 + values.highlight * 0.2) *
        values.opacity *
        tuning.edge *
        (0.78 + materialIntensity * 0.34) *
        (0.84 + thicknessNorm * 0.72),
      0.14,
      0.9,
    );
    const rimAlpha = clamp(
      (0.16 + values.refraction * 0.48 + values.chromaticAberration * 0.12) *
        tuning.edge *
        (0.74 + materialIntensity * 0.34) *
        (0.78 + thicknessNorm * 0.68),
      0.08,
      0.82,
    );
    const highlightAlpha = clamp(
      (0.18 + values.highlight * 0.5 + values.refraction * 0.12) *
        tuning.highlight *
        (0.7 + materialIntensity * 0.42) *
        (0.86 + thicknessNorm * 0.34),
      0.08,
      0.86,
    );
    const glintAlpha = clamp(
      values.highlight *
        values.opacity *
        tuning.highlight *
        (0.13 + materialIntensity * 0.22) *
        (0.86 + thicknessNorm * 0.28),
      0.015,
      0.42,
    );
    const noiseAlpha = clamp(
      values.noise * (0.055 + materialIntensity * 0.13),
      0,
      0.24,
    );
    const protectionAlpha = clamp(
      (0.1 + values.contrastProtection * 0.42) *
        values.opacity *
        tuning.contrast *
        transparencyDamping +
        thicknessNorm * 0.035,
      0.04,
      0.58,
    );
    const causticAlpha = clamp(
      (values.refraction * (0.12 + thicknessNorm * 0.18) +
        values.highlight * 0.08) *
        values.opacity *
        materialIntensity,
      0.015,
      0.38,
    );
    const lensAlpha = clamp(
      (0.08 + lensPower * 0.28 + values.highlight * 0.08) *
        tuning.edge *
        values.opacity,
      0.045,
      0.62,
    );
    const lensDepthAlpha = clamp(
      (0.05 + thicknessNorm * 0.22 + values.refraction * 0.1) *
        tuning.edge *
        transparencyDamping,
      0.035,
      0.48,
    );
    const blurPx = clamp(
      values.blur * tuning.blur * (0.76 + materialIntensity * 0.42) +
        thicknessNorm * 4,
      0,
      64,
    );
    const saturation = clamp(
      1.04 +
        values.tint * 0.26 +
        values.refraction * 0.1 +
        thicknessNorm * 0.08,
      1,
      1.58,
    );
    const contrast = clamp(
      1 +
        values.contrastProtection * 0.17 * tuning.contrast +
        values.refraction * 0.04 -
        values.transparency * 0.03 +
        thicknessNorm * 0.05,
      0.98,
      1.34,
    );
    const shadowAlpha = clamp(
      (0.12 +
        values.contrastProtection * 0.14 +
        materialIntensity * 0.08 +
        thicknessNorm * 0.12) *
        tuning.shadow,
      0.08,
      0.42,
    );
    const borderWidth = clamp(
      1 + thicknessNorm * 1.45 + values.refraction * 0.45,
      1,
      3.2,
    );
    const edgeWidth = clamp(
      values.thickness * (0.72 + values.refraction * 0.5),
      3,
      42,
    );
    const edgeBlur = clamp(
      values.thickness * 0.08 + values.blur * 0.018,
      0.45,
      4,
    );
    const refractionShift =
      values.refraction *
      (7 + materialIntensity * 9) *
      (0.72 + thicknessRatio * 0.82);
    const chromaShift =
      values.chromaticAberration *
      (0.55 + values.refraction * 1.45) *
      (0.8 + thicknessRatio * 0.42);

    return {
      "--glass-fill-alpha": fillAlpha.toFixed(3),
      "--glass-tint-alpha": tintAlpha.toFixed(3),
      "--glass-edge-alpha": edgeAlpha.toFixed(3),
      "--glass-rim-alpha": rimAlpha.toFixed(3),
      "--glass-highlight-alpha": highlightAlpha.toFixed(3),
      "--glass-glint-alpha": glintAlpha.toFixed(3),
      "--glass-noise-alpha": noiseAlpha.toFixed(3),
      "--glass-protection-alpha": protectionAlpha.toFixed(3),
      "--glass-caustic-alpha": causticAlpha.toFixed(3),
      "--glass-lens-alpha": lensAlpha.toFixed(3),
      "--glass-lens-depth-alpha": lensDepthAlpha.toFixed(3),
      "--glass-blur": `${blurPx.toFixed(1)}px`,
      "--glass-saturation": saturation.toFixed(2),
      "--glass-contrast": contrast.toFixed(2),
      "--glass-shadow-alpha": shadowAlpha.toFixed(3),
      "--glass-thickness": `${values.thickness.toFixed(1)}px`,
      "--glass-border-width": `${borderWidth.toFixed(2)}px`,
      "--glass-edge-width": `${edgeWidth.toFixed(1)}px`,
      "--glass-edge-blur": `${edgeBlur.toFixed(2)}px`,
      "--glass-refraction-shift": `${refractionShift.toFixed(1)}px`,
      "--glass-refraction-shift-negative": `${(-refractionShift * 0.72).toFixed(
        1,
      )}px`,
      "--glass-chroma-shift": `${chromaShift.toFixed(2)}px`,
      "--glass-min-width": toCssSize(minWidth) ?? "0px",
      "--glass-min-height": toCssSize(minHeight) ?? "auto",
      "--glass-max-width": toCssSize(maxWidth) ?? "100%",
      "--glass-max-height": toCssSize(maxHeight) ?? "none",
    };
  }, [
    materialIntensity,
    materialVariant,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
    values,
  ]);

  return (
    <div
      className={[
        "glass-panel",
        `glass-panel--${materialVariant}`,
        `glass-panel--mode-${materialColorMode}`,
        resizable ? "glass-panel--resizable" : "glass-panel--static",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <div className="glass-panel_effect-host" aria-hidden="true">
        {effectLayer ?? <DefaultLiquidGlassEffect />}
      </div>
      <div className="glass-panel_content">{children}</div>
    </div>
  );
}

export function DefaultLiquidGlassEffect() {
  return (
    <div className="glass-panel_effect" aria-hidden="true">
      <span className="glass-panel_effect_edge glass-panel_effect_edge--warm" />
      <span className="glass-panel_effect_edge glass-panel_effect_edge--cool" />
      <span className="glass-panel_effect_lens" />
      <span className="glass-panel_effect_depth" />
      <span className="glass-panel_effect_glint" />
      <span className="glass-panel_effect_grain" />
    </div>
  );
}
