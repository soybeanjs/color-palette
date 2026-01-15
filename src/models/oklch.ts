import { ALPHA_PRECISION, OKLAB_M1, OKLAB_M1_INV, OKLAB_M2, OKLAB_M2_INV } from '../constants';
import { clamp, clampHue, isPresent, mul3x3, parseAlpha, parseHue, round } from '../utils';
import type { InputObject, OklchColor, RgbColor, Vector3 } from '../types';
import { clampLinearRgb, clampRgb, linearRgbToRgb, rgbToLinearRgb } from './rgb';

export const clampOklch = (oklch: OklchColor): OklchColor => {
  const { l, c, h, alpha } = oklch;

  return {
    l: clamp(l, 0.0001, 1),
    c: clamp(c, 0.0001, 0.37),
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

export const oklchToRgb = (oklch: OklchColor): RgbColor => {
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

  const lRgb = clampLinearRgb({
    r,
    g,
    b,
    alpha
  });

  const rgb = linearRgbToRgb(lRgb);

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

export const parseOklch = ({ l, c, h, alpha = 1 }: InputObject): RgbColor | null => {
  if (!isPresent(l) || !isPresent(c) || !isPresent(h)) return null;

  const oklch = clampOklch({
    l: Number(l),
    c: Number(c),
    h: Number(h),
    alpha: Number(alpha)
  });

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

/**
 * Parses a valid OKLCH CSS color function/string
 * https://www.w3.org/TR/css-color-4/#specifying-oklch
 * @param input
 * @returns
 */
export const parseOklchString = (input: string): RgbColor | null => {
  const match = oklchMatcher.exec(input);
  if (!match) return null;
  const [_, L, c, h, unit, alpha] = match;

  let l = Number.parseFloat(L);
  if (L.endsWith('%')) {
    l /= 100;
  }

  const oklch = clampOklch({
    l,
    c: Number.parseFloat(c),
    h: parseHue(h, unit),
    alpha: parseAlpha(alpha)
  });
  return oklchToRgb(oklch);
};

export const oklchToOklchString = (oklch: OklchColor): string => {
  const { l, c, h, alpha } = roundOklch(oklch);
  return alpha < 1 ? `oklch(${l}% ${c} ${h} / ${alpha})` : `oklch(${l}% ${c} ${h})`;
};
