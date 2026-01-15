import { ALPHA_PRECISION } from '../constants';
import { clamp, isPresent, parseAlpha, round } from '../utils';
import type { CmykColor, InputObject, RgbColor } from '../types';

/**
 * Clamps the CMYK color object values.
 */
export const clampCmyk = (cmyk: CmykColor): CmykColor => {
  const { c, m, y, k, alpha } = cmyk;

  return {
    c: clamp(c, 0, 100),
    m: clamp(m, 0, 100),
    y: clamp(y, 0, 100),
    k: clamp(k, 0, 100),
    alpha: clamp(alpha)
  };
};

/**
 * Rounds the CMYK color object values.
 */
export const roundCmyk = (cmyk: CmykColor): CmykColor => {
  const { c, m, y, k, alpha } = cmyk;

  return {
    c: round(c, 2),
    m: round(m, 2),
    y: round(y, 2),
    k: round(k, 2),
    alpha: round(alpha, ALPHA_PRECISION)
  };
};

/**
 * Transforms the CMYK color object to RGB.
 * https://www.rapidtables.com/convert/color/cmyk-to-rgb.html
 */
export function cmykToRgb(cmyk: CmykColor): RgbColor {
  const { c, m, y, k, alpha } = cmyk;

  return {
    r: round(255 * (1 - c / 100) * (1 - k / 100)),
    g: round(255 * (1 - m / 100) * (1 - k / 100)),
    b: round(255 * (1 - y / 100) * (1 - k / 100)),
    alpha
  };
}

/**
 * Convert RGB Color Model object to CMYK.
 * https://www.rapidtables.com/convert/color/rgb-to-cmyk.html
 */
export function rgbToCmyk(rgb: RgbColor): CmykColor {
  const { r, g, b, alpha } = rgb;

  const k = 1 - Math.max(r / 255, g / 255, b / 255);
  const c = (1 - r / 255 - k) / (1 - k);
  const m = (1 - g / 255 - k) / (1 - k);
  const y = (1 - b / 255 - k) / (1 - k);

  return {
    c: Number.isNaN(c) ? 0 : round(c * 100),
    m: Number.isNaN(m) ? 0 : round(m * 100),
    y: Number.isNaN(y) ? 0 : round(y * 100),
    k: round(k * 100),
    alpha
  };
}

/**
 * Parses the CMYK color object into RGB.
 */
export function parseCmyk({ c, m, y, k, alpha = 1 }: InputObject): RgbColor | null {
  if (!isPresent(c) || !isPresent(m) || !isPresent(y) || !isPresent(k)) return null;

  const cmyk = clampCmyk({
    c: Number(c),
    m: Number(m),
    y: Number(y),
    k: Number(k),
    alpha: Number(alpha)
  });

  return cmykToRgb(cmyk);
}

const cmykMatcher =
  /^device-cmyk\(\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i;

/**
 * Parses a valid CMYK CSS color function/string
 * https://www.w3.org/TR/css-color-4/#device-cmyk
 */
export const parseCmykString = (input: string): RgbColor | null => {
  const match = cmykMatcher.exec(input);

  if (!match) return null;

  const [, c, m, y, k, al] = match;

  const cmyk = clampCmyk({
    c: parseValue(c),
    m: parseValue(m),
    y: parseValue(y),
    k: parseValue(k),
    alpha: al ? parseAlpha(al) : 1
  });

  return cmykToRgb(cmyk);
};

// 解析单个数值（支持百分比和纯数字）
function parseValue(str: string): number {
  const isPercent = str.endsWith('%');
  const num = Number.parseFloat(isPercent ? str.slice(0, -1) : str);
  return isPercent ? num : num * 100;
}

export function rgbToCmykString(rgb: RgbColor): string {
  const { c, m, y, k, alpha } = roundCmyk(rgbToCmyk(rgb));

  return alpha < 1 ? `device-cmyk(${c}% ${m}% ${y}% ${k}% / ${alpha})` : `device-cmyk(${c}% ${m}% ${y}% ${k}%)`;
}
