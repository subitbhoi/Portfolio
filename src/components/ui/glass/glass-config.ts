export type LiquidGlassVariant = 'regular' | 'clear' | 'prominent'

export type LiquidGlassColorMode = 'auto' | 'light' | 'dark'

export type LiquidGlassValues = {
  opacity: number
  transparency: number
  blur: number
  thickness: number
  refraction: number
  highlight: number
  tint: number
  noise: number
  chromaticAberration: number
  contrastProtection: number
}

export type LiquidGlassVariantTuning = {
  fill: number
  edge: number
  highlight: number
  tint: number
  contrast: number
  shadow: number
  blur: number
}

export const liquidGlassDefaults: LiquidGlassValues = {
  opacity: 0.74,
  transparency: 0.52,
  blur: 28,
  thickness: 16,
  refraction: 0.48,
  highlight: 0.64,
  tint: 0.36,
  noise: 0.16,
  chromaticAberration: 0.2,
  contrastProtection: 0.58,
}

export const liquidGlassDefaultVariant: LiquidGlassVariant = 'regular'

export const liquidGlassDefaultColorMode: LiquidGlassColorMode = 'auto'

export const liquidGlassDefaultIntensity = 0.72

export const liquidGlassVariants = [
  'regular',
  'clear',
  'prominent',
] as const satisfies readonly LiquidGlassVariant[]

export const liquidGlassColorModes = [
  'auto',
  'light',
  'dark',
] as const satisfies readonly LiquidGlassColorMode[]

export const liquidGlassVariantTuning: Record<
  LiquidGlassVariant,
  LiquidGlassVariantTuning
> = {
  regular: {
    fill: 1,
    edge: 1,
    highlight: 1,
    tint: 1,
    contrast: 1,
    shadow: 1,
    blur: 1,
  },
  clear: {
    fill: 0.64,
    edge: 0.88,
    highlight: 0.78,
    tint: 0.72,
    contrast: 0.82,
    shadow: 0.78,
    blur: 0.92,
  },
  prominent: {
    fill: 1.32,
    edge: 1.22,
    highlight: 1.28,
    tint: 1.12,
    contrast: 1.18,
    shadow: 1.16,
    blur: 1.06,
  },
}

const clamp = (
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
) => {
  const finiteValue =
    typeof value === 'number' && Number.isFinite(value) ? value : fallback

  return Math.min(max, Math.max(min, finiteValue))
}

export const normalizeLiquidGlassVariant = (
  variant: unknown = liquidGlassDefaultVariant,
): LiquidGlassVariant =>
  liquidGlassVariants.includes(variant as LiquidGlassVariant)
    ? (variant as LiquidGlassVariant)
    : liquidGlassDefaultVariant

export const normalizeLiquidGlassColorMode = (
  colorMode: unknown = liquidGlassDefaultColorMode,
): LiquidGlassColorMode =>
  liquidGlassColorModes.includes(colorMode as LiquidGlassColorMode)
    ? (colorMode as LiquidGlassColorMode)
    : liquidGlassDefaultColorMode

export const normalizeLiquidGlassValues = (
  values: Partial<LiquidGlassValues> = {},
): LiquidGlassValues => ({
  opacity: clamp(values.opacity, 0.2, 1, liquidGlassDefaults.opacity),
  transparency: clamp(
    values.transparency,
    0,
    0.95,
    liquidGlassDefaults.transparency,
  ),
  blur: clamp(values.blur, 0, 56, liquidGlassDefaults.blur),
  thickness: clamp(values.thickness, 2, 36, liquidGlassDefaults.thickness),
  refraction: clamp(values.refraction, 0, 1, liquidGlassDefaults.refraction),
  highlight: clamp(values.highlight, 0, 1, liquidGlassDefaults.highlight),
  tint: clamp(values.tint, 0, 1, liquidGlassDefaults.tint),
  noise: clamp(values.noise, 0, 1, liquidGlassDefaults.noise),
  chromaticAberration: clamp(
    values.chromaticAberration,
    0,
    1,
    liquidGlassDefaults.chromaticAberration,
  ),
  contrastProtection: clamp(
    values.contrastProtection,
    0,
    1,
    liquidGlassDefaults.contrastProtection,
  ),
})

export const normalizeLiquidGlassIntensity = (
  intensity = liquidGlassDefaultIntensity,
) => clamp(intensity, 0, 1, liquidGlassDefaultIntensity)
