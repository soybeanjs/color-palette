import { ALPHA_PRECISION } from '../constants';
import { clamp, clampHue, isPresent, parseAlpha, parseHue, round } from '../utils';
import type { HwbColor, InputObject, RgbColor } from '../types';
import { hsvToRgb, rgbToHsv } from './hsv';

export const clampHwb = (hwb: HwbColor): HwbColor => {
  const { h, w, b, alpha } = hwb;

  return {
    h: clampHue(h),
    w: clamp(w, 0, 100),
    b: clamp(b, 0, 100),
    alpha: clamp(alpha)
  };
};

export const roundHwb = (hwb: HwbColor): HwbColor => {
  const { h, w, b, alpha } = hwb;

  return {
    h: round(h, 3),
    w: round(w, 3),
    b: round(b, 3),
    alpha: round(alpha, ALPHA_PRECISION)
  };
};

export const rgbToHwb = (rgb: RgbColor): HwbColor => {
  const { r, g, b: rb, alpha } = rgb;

  const { h } = rgbToHsv(rgb);
  const w = (Math.min(r, g, rb) / 255) * 100;
  const b = 100 - (Math.max(r, g, rb) / 255) * 100;
  return { h, w, b, alpha };
};

export const hwbToRgb = (hwb: HwbColor): RgbColor => {
  const { h, w, b, alpha } = hwb;

  return hsvToRgb({
    h,
    s: b === 100 ? 0 : 100 - (w / (100 - b)) * 100,
    v: 100 - b,
    alpha
  });
};

export const parseHwb = ({ h, w, b, alpha = 1 }: InputObject): RgbColor | null => {
  if (!isPresent(h) || !isPresent(w) || !isPresent(b)) return null;

  const hwba = clampHwb({
    h: Number(h),
    w: Number(w),
    b: Number(b),
    alpha: Number(alpha)
  });

  return hwbToRgb(hwba);
};

// The only valid HWB syntax
// hwb( <hue> <percentage> <percentage> [ / <alpha-value> ]? )
const hwbaMatcher =
  /^hwb\(\s*([+-]?[\d.]+)(deg|grad|rad|turn)?\s*[, ]\s*([+-]?[\d.]+)%\s*[, ]\s*([+-]?[\d.]+)%(?:\s*\/\s*([+-]?[\d.]+%?))?\s*\)$/i;

/**
 * Parses a valid HWB[A] CSS color function/string
 * https://www.w3.org/TR/css-color-4/#the-hwb-notation
 */
export const parseHwbString = (input: string): RgbColor | null => {
  const match = hwbaMatcher.exec(input);
  if (!match) return null;

  const [, h, unit, w, b, alpha] = match;

  const hwb = clampHwb({
    h: parseHue(h, unit),
    w: Number.parseFloat(w),
    b: Number.parseFloat(b),
    alpha: parseAlpha(alpha)
  });

  return hwbToRgb(hwb);
};

export const rgbToHwbString = (rgb: RgbColor): string => {
  const { h, w, b, alpha } = roundHwb(rgbToHwb(rgb));
  return alpha < 1 ? `hwb(${h} ${w}% ${b}% / ${alpha})` : `hwb(${h} ${w}% ${b}%)`;
};
