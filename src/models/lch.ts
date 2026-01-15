import { ALPHA_PRECISION } from '../constants';
import { clamp, clampHue, isPresent, parseAlpha, parseHue, round } from '../utils';
import type { InputObject, LchColor, RgbColor } from '../types';
import { labToRgb, rgbToLab } from './lab';

/**
 * Limits LCH axis values.
 * https://www.w3.org/TR/css-color-4/#specifying-lab-lch
 * https://lea.verou.me/2020/04/lch-colors-in-css-what-why-and-how/#how-does-lch-work
 */
export const clampLch = (lab: LchColor): LchColor => {
  const { l, c, h, alpha } = lab;

  return {
    l: clamp(l, 0, 100),
    c: clamp(c),
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
 * Performs CIELCH → CIELAB → CIEXYZ → RGB color conversion
 * https://www.w3.org/TR/css-color-4/#color-conversion-code
 */
export const lchaToRgb = (lcha: LchColor): RgbColor => {
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

export const parseLch = ({ l, c, h, alpha = 1 }: InputObject): RgbColor | null => {
  if (!isPresent(l) || !isPresent(c) || !isPresent(h)) return null;

  const lcha = clampLch({
    l: Number(l),
    c: Number(c),
    h: Number(h),
    alpha: Number(alpha)
  });

  return lchaToRgb(lcha);
};

/**
 * Parsing syntax: lch(L c h [/ alpha])
 * - L: <number|percentage> [0,100]
 * - c: <number> [0,150]
 * - h: <number|angle> [0,360] (deg, rad, grad, turn)
 * - alpha: <number|percentage> [0,1]
 *
 */
const lchaMatcher =
  /^lch\(\s*([+-]?[\d.]+)%?\s+([+-]?[\d.]+)\s+([+-]?[\d.]+)(deg|grad|rad|turn)?(?:\s*\/\s*([+-]?[\d.]+%?))?\s*\)$/i;

/**
 * Parses a valid LCH CSS color function/string
 * https://www.w3.org/TR/css-color-4/#specifying-lab-lch
 */
export const parseLchString = (input: string): RgbColor | null => {
  const match = lchaMatcher.exec(input);
  if (!match) return null;

  const [, l, c, h, unit, alpha] = match;

  const lcha = clampLch({
    l: Number.parseFloat(l),
    c: Number.parseFloat(c),
    h: parseHue(h, unit),
    alpha: parseAlpha(alpha)
  });

  return lchaToRgb(lcha);
};

export const rgbToLchString = (rgb: RgbColor): string => {
  const { l, c, h, alpha } = roundLch(rgbToLch(rgb));
  return alpha < 1 ? `lch(${l}% ${c} ${h} / ${alpha})` : `lch(${l}% ${c} ${h})`;
};
