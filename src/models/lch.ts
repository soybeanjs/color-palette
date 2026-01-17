import { ALPHA_PRECISION } from '../constants';
import { clamp, clampHue, isPresent, parseAlpha, parseHue, round } from '../utils';
import type { InputObject, InputSource, LchColor, RgbColor } from '../types';
import { labToRgb, rgbToLab } from './lab';
import { clampRgb } from './rgb';

/**
 * Limits LCH axis values.
 * https://www.w3.org/TR/css-color-4/#specifying-lab-lch
 * https://lea.verou.me/2020/04/lch-colors-in-css-what-why-and-how/#how-does-lch-work
 */
export const clampLch = (lab: LchColor): LchColor => {
  const { l, c, h, alpha } = lab;

  return {
    l: clamp(l, 0, 100),
    c: clamp(c, 0, 150), // LCH chroma can go up to ~150
    h: clampHue(h),
    alpha: clamp(alpha)
  };
};

export const roundLch = (lab: LchColor): LchColor => {
  const { l, c, h, alpha } = lab;

  return {
    l: round(l, 3),
    c: round(c, 3),
    h: round(h, 3),
    alpha: round(alpha, ALPHA_PRECISION)
  };
};

/**
 * Performs RGB → CIEXYZ → CIELAB → CIELCH color conversion
 * https://www.w3.org/TR/css-color-4/#color-conversion-code
 */
export const rgbToLch = (rgb: RgbColor): LchColor => {
  const { l, a, b, alpha } = rgbToLab(rgb);

  const c = Math.sqrt(a * a + b * b);

  let h: number;
  if (c < 0.0001) {
    h = 0;
  } else {
    h = (Math.atan2(b, a) * 180) / Math.PI;
    if (h < 0) {
      h += 360;
    }
  }

  return {
    l,
    c,
    h,
    alpha
  };
};

/**
 * Convert LCH to RGB without gamut checking (internal helper)
 */
const lchToRgbDirect = (lcha: LchColor): RgbColor => {
  const { l, c, h, alpha } = lcha;
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  return labToRgb({
    l,
    a,
    b,
    alpha
  });
};

/**
 * Check if RGB is within sRGB gamut
 * Note: RGB values are in [0, 255] range (not [0, 1])
 */
const isRgbInGamut = (rgb: RgbColor, epsilon = 0.01): boolean => {
  return (
    rgb.r >= -epsilon &&
    rgb.r <= 255 + epsilon &&
    rgb.g >= -epsilon &&
    rgb.g <= 255 + epsilon &&
    rgb.b >= -epsilon &&
    rgb.b <= 255 + epsilon
  );
};

/**
 * Binary search to find maximum chroma that fits in sRGB gamut for LCH
 * Similar to OKLCH's findGamutChroma
 * @param l - Lightness (0-100)
 * @param h - Hue (0-360)
 * @param alpha - Alpha (0-1)
 * @returns Maximum chroma that fits in sRGB gamut
 */
const findGamutChromaForLch = (l: number, h: number, alpha: number): number => {
  let min = 0;
  // LCH chroma max is ~150
  let max = 150;
  // Higher precision for chroma
  const epsilon = 0.01;

  // Quick check if even max chroma is in gamut
  const maxRgb = lchToRgbDirect({ l, c: max, h, alpha });
  if (isRgbInGamut(maxRgb)) {
    return max;
  }

  // Binary search for maximum in-gamut chroma
  while (max - min > epsilon) {
    const mid = (min + max) / 2;
    const rgb = lchToRgbDirect({ l, c: mid, h, alpha });

    if (isRgbInGamut(rgb)) {
      min = mid;
    } else {
      max = mid;
    }
  }

  return min;
};

/**
 * Performs CIELCH → CIELAB → CIEXYZ → RGB color conversion with gamut mapping
 * https://www.w3.org/TR/css-color-4/#color-conversion-code
 *
 * Similar to OKLCH, if the color is out of sRGB gamut, reduce chroma
 * while preserving lightness and hue
 */
export const lchaToRgb = (lcha: LchColor): RgbColor => {
  const { l, h, alpha } = lcha;

  // Try direct conversion first
  let rgb = lchToRgbDirect(lcha);

  // If out of gamut, reduce chroma to fit
  if (!isRgbInGamut(rgb)) {
    const maxChroma = findGamutChromaForLch(l, h, alpha);
    rgb = lchToRgbDirect({ l, c: maxChroma, h, alpha });
  }

  // Clamp to handle floating point errors
  return clampRgb(rgb);
};

export const parseOriginLch = ({ l, c, h, alpha = 1 }: InputObject): LchColor | null => {
  if (!isPresent(l) || !isPresent(c) || !isPresent(h)) return null;

  return clampLch({
    l: Number(l),
    c: Number(c),
    h: Number(h),
    alpha: Number(alpha)
  });
};

export const parseLch = (input: InputObject): RgbColor | null => {
  const lch = parseOriginLch(input);

  if (!lch) return null;

  return lchaToRgb(lch);
};

/**
 * Parsing syntax: lch(L c h [/ alpha])
 * - L: <number|percentage> [0,100]
 * - c: <number> [0,150]
 * - h: <number|angle> [0,360] (deg, rad, grad, turn)
 * - alpha: <number|percentage> [0,1]
 */
const lchaMatcher =
  /^lch\(\s*([+-]?[\d.]+)%?\s+([+-]?[\d.]+)\s+([+-]?[\d.]+)(deg|grad|rad|turn)?(?:\s*\/\s*([+-]?[\d.]+%?))?\s*\)$/i;

export const parseOriginLchString = (input: string): LchColor | null => {
  const match = lchaMatcher.exec(input);
  if (!match) return null;

  const [_, l, c, h, unit, alpha] = match;

  return clampLch({
    l: Number.parseFloat(l),
    c: Number.parseFloat(c),
    h: parseHue(h, unit),
    alpha: parseAlpha(alpha)
  });
};

export const parseLchString = (input: string): RgbColor | null => {
  const lch = parseOriginLchString(input);

  if (!lch) return null;

  return lchaToRgb(lch);
};

export const toLchString = (lch: LchColor): string => {
  const { l, c, h, alpha } = roundLch(lch);

  return alpha < 1 ? `lch(${l}% ${c} ${h} / ${alpha})` : `lch(${l}% ${c} ${h})`;
};

export const rgbToLchString = (rgb: RgbColor): string => {
  const lch = rgbToLch(rgb);

  return toLchString(lch);
};

export const parseLchBySource = (source?: InputSource): LchColor | null => {
  if (!source || source.format !== 'lch') return null;

  const { input } = source;

  if (typeof input === 'string') {
    return parseOriginLchString(input);
  }

  if (typeof input === 'object') {
    return parseOriginLch(input);
  }

  return null;
};

export const toLchStringBySource = (source?: InputSource): string | null => {
  const lch = parseLchBySource(source);

  if (!lch) return null;

  return toLchString(lch);
};
