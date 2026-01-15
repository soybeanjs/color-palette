import { ALPHA_PRECISION, OKLAB_M1, OKLAB_M1_INV, OKLAB_M2, OKLAB_M2_INV } from '../constants';
import { clamp, isPresent, mul3x3, parseAlpha, round } from '../utils';
import type { InputObject, OklabColor, RgbColor, Vector3 } from '../types';
import { clampLinearRgb, clampRgb, linearRgbToRgb, rgbToLinearRgb } from './rgb';

export const clampOklab = (oklab: OklabColor): OklabColor => {
  const { l, a, b, alpha } = oklab;

  return {
    l: clamp(l, 0.0001, 1),
    a: clamp(a, -0.4, 0.4),
    b: clamp(b, -0.4, 0.4),
    alpha: clamp(alpha)
  };
};

export const roundOklab = (oklab: OklabColor): OklabColor => {
  const { l, a, b, alpha } = oklab;

  return {
    l: round(l, 3),
    a: round(a, 3),
    b: round(b, 3),
    alpha: round(alpha, ALPHA_PRECISION)
  };
};

export const oklabToRgb = (oklab: OklabColor): RgbColor => {
  const lmsHat = mul3x3(OKLAB_M2_INV, [oklab.l, oklab.a, oklab.b]);
  const lms = lmsHat.map(v => v * v * v) as unknown as Vector3;
  const [r, g, b] = mul3x3(OKLAB_M1_INV, lms);

  const lRgb = clampLinearRgb({
    r,
    g,
    b,
    alpha: oklab.alpha
  });

  const rgb = linearRgbToRgb(lRgb);

  return clampRgb(rgb);
};

export const rgbToOklab = (rgb: RgbColor): OklabColor => {
  const lRgb = rgbToLinearRgb(rgb);
  const lms = mul3x3(OKLAB_M1, [lRgb.r, lRgb.g, lRgb.b]);
  const lmsHat = lms.map(v => Math.cbrt(v)) as unknown as Vector3;
  const [l, a, b] = mul3x3(OKLAB_M2, lmsHat);

  return clampOklab({ l, a, b, alpha: rgb.alpha });
};

export const parseOklab = ({ l, a, b, alpha = 1 }: InputObject): RgbColor | null => {
  if (!isPresent(l) || !isPresent(a) || !isPresent(b)) return null;

  const oklab = clampOklab({
    l: Number(l),
    a: Number(a),
    b: Number(b),
    alpha: Number(alpha)
  });

  return oklabToRgb(oklab);
};

/**
 * Parsing syntax: oklab(L a b [/ alpha])
 * - L: <number|percentage>
 * - a: <number>
 * - b: <number>
 * - alpha: <number|percentage>
 */
const oklabMatcher = /^oklab\(\s*([+-]?[\d.]+)%?\s+([+-]?[\d.]+)\s+([+-]?[\d.]+)(?:\s*\/\s*([+-]?[\d.]+%?))?\s*\)$/i;

/**
 * Parses a valid OKLAB CSS color function/string
 * https://www.w3.org/TR/css-color-4/#specifying-oklab
 * @param input
 * @returns
 */
export const parseOklabString = (input: string): RgbColor | null => {
  const match = oklabMatcher.exec(input);

  if (!match) return null;

  const [_, L, a, b, alpha] = match;

  let l = Number.parseFloat(L);
  if (L.endsWith('%')) {
    l /= 100;
  }

  const oklab = clampOklab({
    l,
    a: Number.parseFloat(a),
    b: Number.parseFloat(b),
    alpha: parseAlpha(alpha)
  });

  return oklabToRgb(oklab);
};

export const rgbToOklabString = (rgb: RgbColor): string => {
  const { l, a, b, alpha } = roundOklab(rgbToOklab(rgb));
  return alpha < 1 ? `oklab(${l}% ${a} ${b} / ${alpha})` : `oklab(${l}% ${a} ${b})`;
};
