/*
 * Palette domain logic.
 *
 * Pure, dependency-free functions so the generator and the contrast report can
 * be unit tested without a DOM. Colour is expressed as OKLCH triplets; the only
 * place sRGB appears is the hex conversion used for clipboard output.
 */

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

export interface Swatch extends Oklch {
  locked: boolean;
}

export type WcagLevel = "AAA" | "AA" | "AA Large" | "Fail";

export interface TextTone {
  tone: "light" | "dark";
  ratio: number;
  level: WcagLevel;
}

const round = (value: number, places: number) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeHue = (hue: number) => ((hue % 360) + 360) % 360;

/** Small deterministic PRNG (mulberry32) so a seed always yields one palette. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a fresh palette of `count` swatches around `baseHue`. Deterministic. */
export function createPalette(
  seed: number,
  baseHue: number,
  count: number,
): Swatch[] {
  const size = Math.max(1, Math.floor(count));
  const random = mulberry32(seed);
  return Array.from({ length: size }, (_, index) => {
    const t = size === 1 ? 0.5 : index / (size - 1);
    const lightness = clamp(
      0.16 + 0.76 * (1 - t) + (random() - 0.5) * 0.06,
      0.12,
      0.96,
    );
    const hue = normalizeHue(baseHue + (random() - 0.5) * 36);
    const chroma = clamp(
      (0.04 + 0.16 * Math.sin(Math.PI * (1 - t))) * (0.85 + 0.3 * random()),
      0.01,
      0.25,
    );
    return {
      l: round(lightness, 3),
      c: round(chroma, 3),
      h: round(hue, 1),
      locked: false,
    };
  });
}

/** Re-roll every unlocked swatch, keeping locked swatches byte-for-byte. */
export function regenerateUnlocked(
  swatches: Swatch[],
  seed: number,
  baseHue: number,
): Swatch[] {
  const fresh = createPalette(seed, baseHue, swatches.length);
  return swatches.map((swatch, index) =>
    swatch.locked ? { ...swatch } : fresh[index],
  );
}

/** Change the swatch count while preserving any locked swatches by index. */
export function resizePalette(
  swatches: Swatch[],
  seed: number,
  baseHue: number,
  count: number,
): Swatch[] {
  const fresh = createPalette(seed, baseHue, count);
  return fresh.map((swatch, index) => {
    const previous = swatches[index];
    return previous?.locked ? { ...previous } : swatch;
  });
}

function oklchToLinearRgb(
  l: number,
  c: number,
  h: number,
): [number, number, number] {
  const radians = (h * Math.PI) / 180;
  const a = c * Math.cos(radians);
  const b = c * Math.sin(radians);
  const lPrime = l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = lPrime ** 3;
  const m3 = mPrime ** 3;
  const s3 = sPrime ** 3;
  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
}

const linearToSrgb = (value: number) =>
  value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;

function channelToByte(value: number): number {
  return Math.round(clamp(linearToSrgb(clamp(value, 0, 1)), 0, 1) * 255);
}

/** OKLCH -> lowercase `#rrggbb`. Used for clipboard output only. */
export function oklchToHex(l: number, c: number, h: number): string {
  const bytes = oklchToLinearRgb(l, c, h).map(channelToByte);
  return `#${bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

/** OKLCH triplet as a CSS `oklch()` string for inline styles and exports. */
export function oklchCss(l: number, c: number, h: number): string {
  return `oklch(${round(l, 3)} ${round(c, 3)} ${round(h, 1)})`;
}

function relativeLuminance(l: number, c: number, h: number): number {
  const [r, g, b] = oklchToLinearRgb(l, c, h).map((value) =>
    clamp(value, 0, 1),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two OKLCH colours (1 – 21). */
export function contrastRatio(a: Oklch, b: Oklch): number {
  const first = relativeLuminance(a.l, a.c, a.h);
  const second = relativeLuminance(b.l, b.c, b.h);
  const [hi, lo] = first > second ? [first, second] : [second, first];
  return (hi + 0.05) / (lo + 0.05);
}

/** Classify a contrast ratio for normal-size text (AA Large at ≥ 3). */
export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

/** Near-paper and near-ink extremes used to label swatches. Fixed, not themed. */
const TEXT_LIGHT: Oklch = { l: 0.99, c: 0.002, h: 250 };
const TEXT_DARK: Oklch = { l: 0.16, c: 0.01, h: 260 };

/** Which text tone reads best on a swatch, with its ratio and grade. */
export function textOnSwatch(swatch: Oklch): TextTone {
  const light = contrastRatio(TEXT_LIGHT, swatch);
  const dark = contrastRatio(TEXT_DARK, swatch);
  const tone = light >= dark ? "light" : "dark";
  const ratio = tone === "light" ? light : dark;
  return { tone, ratio: round(ratio, 2), level: wcagLevel(ratio) };
}

/** Palette as copy-pasteable CSS custom properties in OKLCH. */
export function toCssVariables(swatches: Oklch[]): string {
  const lines = swatches.map(
    (swatch, index) =>
      `  --palette-${index + 1}: ${oklchCss(swatch.l, swatch.c, swatch.h)};`,
  );
  return `:root {\n${lines.join("\n")}\n}`;
}

/** Palette as a pretty-printed JSON report (hex, OKLCH, contrast). */
export function toJson(swatches: Swatch[]): string {
  return JSON.stringify(
    {
      swatches: swatches.map((swatch, index) => ({
        index: index + 1,
        hex: oklchToHex(swatch.l, swatch.c, swatch.h),
        oklch: oklchCss(swatch.l, swatch.c, swatch.h),
        contrast: textOnSwatch(swatch),
        locked: swatch.locked,
      })),
    },
    null,
    2,
  );
}
