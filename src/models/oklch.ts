import { ALPHA_PRECISION, OKLAB_M1, OKLAB_M1_INV, OKLAB_M2, OKLAB_M2_INV } from '../constants';
import { clamp, clampHue, isPresent, mul3x3, parseAlpha, parseHue, parseValueToDecimal, round } from '../utils';
import type { InputObject, InputSource, OklchColor, RgbColor, Vector3 } from '../types';
import { clampLinearRgb, clampRgb, linearRgbToRgb, rgbToLinearRgb } from './rgb';

export const clampOklch = (oklch: OklchColor): OklchColor => {
  const { l, c, h, alpha } = oklch;

  return {
    l: clamp(l, 0, 1),
    c: clamp(c, 0, 0.37),
    h: clampHue(h),
    alpha: clamp(alpha)
  };
};

export const roundOklch = (oklch: OklchColor): OklchColor => {
  const { l, c, h, alpha } = oklch;

  return {
    l: round(l, 3),
    c: round(c, 3),
    h: round(h, 3),
    alpha: round(alpha, ALPHA_PRECISION)
  };
};

/**
 * Convert OKLCH to Linear RGB without gamut mapping
 */
const oklchToLinearRgb = (oklch: OklchColor): RgbColor => {
  const { l, c, h, alpha } = oklch;

  // Polar to Cartesian (OKLAB)
  const hRad = (h * Math.PI) / 180;
  const labL = l;
  const labA = c * Math.cos(hRad);
  const labB = c * Math.sin(hRad);

  // OKLAB to Linear RGB
  const lmsHat = mul3x3(OKLAB_M2_INV, [labL, labA, labB]);
  const lms = lmsHat.map(v => v * v * v) as unknown as Vector3;
  const [r, g, b] = mul3x3(OKLAB_M1_INV, lms);

  return { r, g, b, alpha };
};

/**
 * Check if a linear RGB color is within sRGB gamut
 */
const isInGamut = (linearRgb: RgbColor, epsilon = 0.000001): boolean => {
  return (
    linearRgb.r >= -epsilon &&
    linearRgb.r <= 1 + epsilon &&
    linearRgb.g >= -epsilon &&
    linearRgb.g <= 1 + epsilon &&
    linearRgb.b >= -epsilon &&
    linearRgb.b <= 1 + epsilon
  );
};

/**
 * Binary search to find maximum chroma that fits in sRGB gamut
 * @param l - Lightness (0-1)
 * @param h - Hue (0-360)
 * @param alpha - Alpha (0-1)
 * @returns Maximum chroma that fits in sRGB gamut
 */
const findGamutChroma = (l: number, h: number, alpha: number): number => {
  let min = 0;
  // OKLCH max chroma in sRGB is ~0.4, but we set 0.37 for safety
  // This matches the clampOklch upper bound
  let max = 0.37;
  // Higher precision: 0.00001 instead of 0.0001
  const epsilon = 0.00001;

  // Quick check if even max chroma is in gamut
  const maxLinearRgb = oklchToLinearRgb({ l, c: max, h, alpha });
  if (isInGamut(maxLinearRgb, epsilon)) {
    return max;
  }

  // Binary search for maximum in-gamut chroma
  while (max - min > epsilon) {
    const mid = (min + max) / 2;
    const linearRgb = oklchToLinearRgb({ l, c: mid, h, alpha });

    if (isInGamut(linearRgb, epsilon)) {
      min = mid;
    } else {
      max = mid;
    }
  }

  return min;
};

export const oklchToRgb = (oklch: OklchColor): RgbColor => {
  const { l, h, alpha } = oklch;

  // Try direct conversion first
  let linearRgb = oklchToLinearRgb(oklch);

  // If out of gamut, reduce chroma to fit
  if (!isInGamut(linearRgb)) {
    const maxChroma = findGamutChroma(l, h, alpha);
    linearRgb = oklchToLinearRgb({ l, c: maxChroma, h, alpha });
  }

  // Clamp to handle floating point errors
  linearRgb = clampLinearRgb(linearRgb);

  // Convert to sRGB
  const rgb = linearRgbToRgb(linearRgb);

  return clampRgb(rgb);
};

export const rgbToOklch = (rgb: RgbColor): OklchColor => {
  const lRgb = rgbToLinearRgb(rgb);
  const lms = mul3x3(OKLAB_M1, [lRgb.r, lRgb.g, lRgb.b]);
  const lmsHat = lms.map(v => Math.cbrt(v)) as unknown as Vector3;
  const [l, a, b] = mul3x3(OKLAB_M2, lmsHat);

  const chroma = Math.sqrt(a * a + b * b);
  let hue: number;
  if (chroma < 0.0001) {
    hue = 0;
  } else {
    hue = Math.atan2(b, a) * (180 / Math.PI);
    if (hue < 0) {
      hue += 360;
    }
  }

  return clampOklch({ l, c: chroma, h: hue, alpha: rgb.alpha });
};

export const parseOriginOklch = ({ l, c, h, alpha = 1 }: InputObject): OklchColor | null => {
  if (!isPresent(l) || !isPresent(c) || !isPresent(h)) return null;

  const oklch = clampOklch({
    l: Number(l),
    c: Number(c),
    h: Number(h),
    alpha: Number(alpha)
  });

  return oklch;
};

export const parseOklch = (input: InputObject): RgbColor | null => {
  const oklch = parseOriginOklch(input);

  if (!oklch) return null;

  return oklchToRgb(oklch);
};

/**
 * Parsing syntax: oklch(L c h [/ alpha])
 * - L: <number|percentage>
 * - c: <number>
 * - h: <number>
 * - alpha: <number|percentage>
 */
const oklchMatcher =
  /^oklch\(\s*([+-]?[\d.]+)%?\s+([+-]?[\d.]+)\s+([+-]?[\d.]+)(deg|grad|rad|turn)?(?:\s*\/\s*([+-]?[\d.]+%?))?\s*\)$/i;

export const parseOriginOklchString = (input: string): OklchColor | null => {
  const match = oklchMatcher.exec(input);
  if (!match) return null;

  const [_, l, c, h, unit, alpha] = match;

  return clampOklch({
    l: parseValueToDecimal(l),
    c: Number.parseFloat(c),
    h: parseHue(h, unit),
    alpha: parseAlpha(alpha)
  });
};

export const parseOklchString = (input: string): RgbColor | null => {
  const oklch = parseOriginOklchString(input);

  if (!oklch) return null;

  return oklchToRgb(oklch);
};

export const toOklchString = (oklch: OklchColor): string => {
  const { l, c, h, alpha } = roundOklch(oklch);

  return alpha < 1 ? `oklch(${l * 100}% ${c} ${h} / ${alpha})` : `oklch(${l * 100}% ${c} ${h})`;
};

export const rgbToOklchString = (rgb: RgbColor): string => {
  const oklch = rgbToOklch(rgb);

  return toOklchString(oklch);
};

export const parseOklchBySource = (source?: InputSource): OklchColor | null => {
  if (!source || source.format !== 'oklch') return null;

  const { input } = source;

  if (typeof input === 'string') {
    return parseOriginOklchString(input);
  }

  if (typeof input === 'object') {
    return parseOriginOklch(input);
  }

  return null;
};

export const toOklchStringBySource = (source?: InputSource): string | null => {
  const oklch = parseOklchBySource(source);

  if (!oklch) return null;

  return toOklchString(oklch);
};
