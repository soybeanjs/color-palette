import { ALPHA_PRECISION } from '../constants';
import { clamp, clampHue, isPresent, parseAlpha, parseHue, round } from '../utils';
import type { HslColor, HsvColor, InputObject, RgbColor } from '../types';
import { hsvToRgb, rgbToHsv } from './hsv';

export const clampHsl = (hsl: HslColor): HslColor => {
  const { h, s, l, alpha } = hsl;

  return {
    h: clampHue(h),
    s: clamp(s, 0, 100),
    l: clamp(l, 0, 100),
    alpha: clamp(alpha)
  };
};

export const roundHsl = (hsl: HslColor): HslColor => {
  const { h, s, l, alpha } = hsl;

  return {
    h: round(h, 3),
    s: round(s, 3),
    l: round(l, 3),
    alpha: round(alpha, ALPHA_PRECISION)
  };
};

export const hslToHsv = (hsl: HslColor): HsvColor => {
  const { h, l, alpha } = hsl;

  const s = (hsl.s * (l < 50 ? l : 100 - l)) / 100;

  return {
    h,
    s: s > 0 ? ((2 * s) / (l + s)) * 100 : 0,
    v: l + s,
    alpha
  };
};

export const hsvToHsl = ({ h, s, v, alpha }: HsvColor): HslColor => {
  const hh = ((200 - s) * v) / 100;

  return {
    h,
    s: hh > 0 && hh < 200 ? ((s * v) / 100 / (hh <= 100 ? hh : 200 - hh)) * 100 : 0,
    l: hh / 2,
    alpha
  };
};

export const hslToRgb = (hsl: HslColor): RgbColor => {
  return hsvToRgb(hslToHsv(hsl));
};

export const rgbToHsl = (rgb: RgbColor): HslColor => {
  return hsvToHsl(rgbToHsv(rgb));
};

export const parseHsl = ({ h, s, l, alpha = 1 }: InputObject): RgbColor | null => {
  if (!isPresent(h) || !isPresent(s) || !isPresent(l)) return null;

  const hsl = clampHsl({
    h: Number(h),
    s: Number(s),
    l: Number(l),
    alpha: Number(alpha)
  });

  return hslToRgb(hsl);
};

export const rgbToHslString = (rgb: RgbColor): string => {
  const { h, s, l, alpha } = roundHsl(rgbToHsl(rgb));
  return alpha < 1 ? `hsl(${h} ${s}% ${l}% / ${alpha})` : `hsl(${h} ${s}% ${l}%)`;
};

const hslMatcher =
  /^hsl?\(\s*([+-]?[\d.]+)(deg|grad|rad|turn)?\s*[, ]\s*([+-]?[\d.]+)%\s*[, ]\s*([+-]?[\d.]+)%(?:\s*\/\s*([+-]?[\d.]+%?))?\s*\)$/i;

export const parseHslString = (input: string): RgbColor | null => {
  const match = hslMatcher.exec(input);
  if (!match) return null;

  const [, h, unit, s, l, alpha] = match;

  const hsl = clampHsl({
    h: parseHue(h, unit),
    s: Number.parseFloat(s),
    l: Number.parseFloat(l),
    alpha: parseAlpha(alpha)
  });

  return hslToRgb(hsl);
};
