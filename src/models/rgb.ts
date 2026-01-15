import { ALPHA_PRECISION } from '../constants';
import { clamp, isPresent, parseAlpha, round } from '../utils';
import type { InputObject, RgbColor } from '../types';

export const clampRgb = (rgb: RgbColor): RgbColor => {
  const { r, g, b, alpha } = rgb;

  return {
    r: clamp(r, 0, 255),
    g: clamp(g, 0, 255),
    b: clamp(b, 0, 255),
    alpha: clamp(alpha)
  };
};

export const roundRgb = (rgb: RgbColor): RgbColor => {
  const { r, g, b, alpha } = rgb;

  return {
    r: round(r, 2),
    g: round(g, 2),
    b: round(b, 2),
    alpha: round(alpha, ALPHA_PRECISION)
  };
};

export const clampLinearRgb = (rgb: RgbColor): RgbColor => {
  const { r, g, b, alpha } = rgb;

  return {
    r: clamp(r, 0.0001, 1),
    g: clamp(g, 0.0001, 1),
    b: clamp(b, 0.0001, 1),
    alpha: clamp(alpha)
  };
};

export const roundLinearRgb = (rgb: RgbColor): RgbColor => {
  const { r, g, b, alpha } = rgb;

  return {
    r: round(r),
    g: round(g),
    b: round(b),
    alpha: round(alpha, ALPHA_PRECISION)
  };
};

export const parseRgb = ({ r, g, b, alpha = 1 }: InputObject): RgbColor | null => {
  if (!isPresent(r) || !isPresent(g) || !isPresent(b)) return null;

  return clampRgb({
    r: Number(r),
    g: Number(g),
    b: Number(b),
    alpha: Number(alpha)
  });
};

export const parseLinearRgb = ({ r, g, b, alpha = 1 }: InputObject): RgbColor | null => {
  if (!isPresent(r) || !isPresent(g) || !isPresent(b)) return null;

  return clampLinearRgb({
    r: Number(r),
    g: Number(g),
    b: Number(b),
    alpha: Number(alpha)
  });
};

/**
 * Converts a single sRGB component value to linear light.
 * This applies gamma expansion (inverse of sRGB transfer function).
 *
 * The sRGB transfer function has two parts:
 * - Linear segment for very dark values (≤ 0.04045)
 * - Power curve with gamma ≈ 2.4 for brighter values
 *
 * @param value - sRGB component value (0-255)
 */
export const rgbToLinear = (value: number): number => {
  const v = value / 255;

  // Linear segment (v ≤ 0.04045) vs power curve (gamma 2.4)
  if (v <= 0.04045) {
    return v / 12.92;
  }
  return ((v + 0.055) / 1.055) ** 2.4;
};

/**
 * Converts a linear light value to sRGB component.
 * This applies gamma compression (sRGB transfer function).
 *
 * The sRGB transfer function has two parts:
 * - Linear segment for very dark values (≤ 0.0031308)
 * - Power curve with gamma ≈ 1/2.4 for brighter values
 *
 * @param value - Linear light value (0-1)
 */
export function linearToRgb(value: number): number {
  // Linear segment (≤ 0.0031308) vs power curve (gamma 1/2.4)
  const v = value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;

  return v * 255;
}

/**
 * Converts an RGBA color to Linear RGB color space.
 *
 * This applies gamma expansion to each RGB component,
 * converting from perceptually uniform sRGB to physically
 * linear light values. Alpha channel is passed through unchanged.
 *
 * @param rgb - The RGBA color to convert (r, g, b: 0-255, a: 0-1)
 */
export function rgbToLinearRgb(rgb: RgbColor): RgbColor {
  return {
    r: rgbToLinear(rgb.r),
    g: rgbToLinear(rgb.g),
    b: rgbToLinear(rgb.b),
    alpha: rgb.alpha
  };
}

/**
 * Converts a Linear RGB color to RGBA color space.
 *
 * This applies gamma compression to each RGB component,
 * converting from physically linear light values to
 * perceptually uniform sRGB. Alpha channel is passed through unchanged.
 *
 * @param rgb - The LinearRGB color to convert (r, g, b: 0-1 linear, a: 0-1)
 * @returns RGBA color (r, g, b: 0-255, a: 0-1)
 *
 * @example
 * ```typescript
 * // Pure red
 * linearRgbToRgb({ r: 1, g: 0, b: 0, a: 1 });
 * // { r: 255, g: 0, b: 0, a: 1 }
 *
 * // Linear mid-point is NOT perceptual mid-gray
 * linearRgbToRgb({ r: 0.5, g: 0.5, b: 0.5, a: 1 });
 * // { r: 188, g: 188, b: 188, a: 1 } - looks quite bright!
 *
 * // With transparency
 * linearRgbToRgb({ r: 1, g: 0.216, b: 0, a: 0.5 });
 * // { r: 255, g: 128, b: 0, a: 0.5 }
 * ```
 */
export function linearRgbToRgb(rgb: RgbColor): RgbColor {
  return {
    r: linearToRgb(rgb.r),
    g: linearToRgb(rgb.g),
    b: linearToRgb(rgb.b),
    alpha: rgb.alpha
  };
}

const rgbMatcher = /^rgb?\(\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i;

/**
 * Parses a valid RGB[A] CSS color function/string
 * https://www.w3.org/TR/css-color-4/#rgb-functions
 */
export const parseRgbString = (input: string): RgbColor | null => {
  const match = rgbMatcher.exec(input);

  if (!match) return null;

  const [_, r, g, b, alpha] = match;

  return clampRgb({
    r: parseValue(r),
    g: parseValue(g),
    b: parseValue(b),
    alpha: parseAlpha(alpha)
  });
};

// 解析颜色分量（支持数字和百分比）
function parseValue(str: string): number {
  if (str.endsWith('%')) {
    const percent = Number.parseFloat(str.slice(0, -1));
    return Math.round((percent / 100) * 255);
  }
  return Number.parseFloat(str);
}

export const rgbToRgbString = (rgb: RgbColor): string => {
  const { r, g, b, alpha } = roundRgb(rgb);
  return alpha < 1 ? `rgb(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
};
