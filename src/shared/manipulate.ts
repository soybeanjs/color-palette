import { rgbToHsl } from '../models/hsl';
import { clampLab, labToRgb, rgbToLab } from '../models/lab';
import { clamp } from '../utils';
import type { HslColor, RgbColor } from '../types';

export const changeAlpha = (rgb: RgbColor, alpha: number): RgbColor => ({
  r: rgb.r,
  g: rgb.g,
  b: rgb.b,
  alpha
});

export const invert = (rgb: RgbColor): RgbColor => ({
  r: 255 - rgb.r,
  g: 255 - rgb.g,
  b: 255 - rgb.b,
  alpha: rgb.alpha
});

export const lighten = (rgb: RgbColor, amount: number): HslColor => {
  const hsl = rgbToHsl(rgb);

  return {
    h: hsl.h,
    s: hsl.s,
    l: clamp(hsl.l + amount * 100, 0, 100),
    alpha: hsl.alpha
  };
};

export const mix = (rgb1: RgbColor, rgb2: RgbColor, ratio: number): RgbColor => {
  const lab1 = rgbToLab(rgb1);
  const lab2 = rgbToLab(rgb2);

  const mixture = clampLab({
    l: lab1.l * (1 - ratio) + lab2.l * ratio,
    a: lab1.a * (1 - ratio) + lab2.a * ratio,
    b: lab1.b * (1 - ratio) + lab2.b * ratio,
    alpha: lab1.alpha * (1 - ratio) + lab2.alpha * ratio
  });

  return labToRgb(mixture);
};

export const saturate = (rgb: RgbColor, amount: number): HslColor => {
  const { h, s, l, alpha } = rgbToHsl(rgb);

  return {
    h,
    s: clamp(s + amount * 100, 0, 100),
    l,
    alpha
  };
};
