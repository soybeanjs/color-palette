import { ALPHA_PRECISION } from '../constants';
import { clamp, clampHue, isPresent, round } from '../utils';
import type { HsvColor, InputObject, RgbColor } from '../types';

export const clampHsv = (hsv: HsvColor): HsvColor => ({
  h: clampHue(hsv.h),
  s: clamp(hsv.s, 0, 100),
  v: clamp(hsv.v, 0, 100),
  alpha: clamp(hsv.alpha)
});

export const roundHsv = (hsv: HsvColor): HsvColor => ({
  h: round(hsv.h, 3),
  s: round(hsv.s, 3),
  v: round(hsv.v, 3),
  alpha: round(hsv.alpha, ALPHA_PRECISION)
});

export const hsvToRgb = (hsv: HsvColor): RgbColor => {
  const h = (hsv.h / 360) * 6;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  const hh = Math.floor(h);
  const b = v * (1 - s);
  const c = v * (1 - (h - hh) * s);
  const d = v * (1 - (1 - h + hh) * s);
  const module = hh % 6;

  return {
    r: [v, c, b, b, d, v][module] * 255,
    g: [d, v, v, c, b, b][module] * 255,
    b: [b, b, d, v, v, c][module] * 255,
    alpha: hsv.alpha
  };
};

export const parseHsv = ({ h, s, v, alpha = 1 }: InputObject): RgbColor | null => {
  if (!isPresent(h) || !isPresent(s) || !isPresent(v)) return null;

  const hsv = clampHsv({
    h: Number(h),
    s: Number(s),
    v: Number(v),
    alpha: Number(alpha)
  });

  return hsvToRgb(hsv);
};

export const rgbToHsv = ({ r, g, b, alpha }: RgbColor): HsvColor => {
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);

  let hh = 0;
  if (delta) {
    if (max === r) {
      hh = (g - b) / delta;
    } else if (max === g) {
      hh = 2 + (b - r) / delta;
    } else {
      hh = 4 + (r - g) / delta;
    }
  }

  return {
    h: 60 * (hh < 0 ? hh + 6 : hh),
    s: max ? (delta / max) * 100 : 0,
    v: (max / 255) * 100,
    alpha
  };
};
