import { ALPHA_PRECISION, OKLAB_M1, OKLAB_M1_INV, OKLAB_M2, OKLAB_M2_INV } from '../constants';
import { clamp, isPresent, mul3x3, parseAlpha, parseValueToDecimal, round } from '../utils';
import type { InputObject, InputSource, OklabColor, RgbColor, Vector3 } from '../types';
import { clampLinearRgb, clampRgb, linearRgbToRgb, rgbToLinearRgb } from './rgb';

export const clampOklab = (oklab: OklabColor): OklabColor => {
  const { l, a, b, alpha } = oklab;

  return {
    l: clamp(l, 0, 1),
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

export const parseOriginOklab = ({ l, a, b, alpha = 1 }: InputObject): OklabColor | null => {
  if (!isPresent(l) || !isPresent(a) || !isPresent(b)) return null;

  const oklab = clampOklab({
    l: Number(l),
    a: Number(a),
    b: Number(b),
    alpha: Number(alpha)
  });

  return oklab;
};

export const parseOklab = (input: InputObject): RgbColor | null => {
  const oklab = parseOriginOklab(input);

  if (!oklab) return null;

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
 * Parses a valid OKLAB CSS color function/string to OKLAB object
 * https://www.w3.org/TR/css-color-4/#specifying-oklab
 */
const parseOriginOklabString = (input: string): OklabColor | null => {
  const match = oklabMatcher.exec(input);

  if (!match) return null;

  const [_, l, a, b, alpha] = match;

  return clampOklab({
    l: parseValueToDecimal(l),
    a: Number.parseFloat(a),
    b: Number.parseFloat(b),
    alpha: parseAlpha(alpha)
  });
};

/**
 * Parses a valid OKLAB CSS color function/string to RGB
 * https://www.w3.org/TR/css-color-4/#specifying-oklab
 */
export const parseOklabString = (input: string): RgbColor | null => {
  const oklab = parseOriginOklabString(input);

  if (!oklab) return null;

  return oklabToRgb(oklab);
};

export const toOklabString = (oklab: OklabColor): string => {
  const { l, a, b, alpha } = roundOklab(oklab);
  return alpha < 1 ? `oklab(${l}% ${a} ${b} / ${alpha})` : `oklab(${l}% ${a} ${b})`;
};

export const rgbToOklabString = (rgb: RgbColor): string => {
  const oklab = rgbToOklab(rgb);
  return toOklabString(oklab);
};

/**
 * Parse OKLAB from cached source input to avoid conversion loss
 */
export const parseOklabBySource = (source?: InputSource): OklabColor | null => {
  if (!source || source.format !== 'oklab') return null;

  const { input } = source;

  // Handle string input
  if (typeof input === 'string') {
    return parseOriginOklabString(input);
  }

  // Handle object input
  if (typeof input === 'object') {
    return parseOriginOklab(input);
  }

  return null;
};

/**
 * Convert to OKLAB string from cached source input to avoid conversion loss
 */
export const toOklabStringBySource = (source?: InputSource): string | null => {
  const oklab = parseOklabBySource(source);

  if (!oklab) return null;

  return toOklabString(oklab);
};
