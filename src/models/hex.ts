import { round } from '../utils';
import type { RgbColor } from '../types';
import { roundRgb } from './rgb';

const hexMatcher = /^#([0-9a-f]{3,8})$/i;

/** Parses any valid Hex3, Hex4, Hex6 or Hex8 string and converts it to an RGBA object */
export const parseHex = (hexStr: string): RgbColor | null => {
  const hexMatch = hexMatcher.exec(hexStr);

  if (!hexMatch) return null;

  const hex = hexMatch[1];

  if (hex.length <= 4) {
    return {
      r: Number.parseInt(hex[0] + hex[0], 16),
      g: Number.parseInt(hex[1] + hex[1], 16),
      b: Number.parseInt(hex[2] + hex[2], 16),
      alpha: hex.length === 4 ? round(Number.parseInt(hex[3] + hex[3], 16) / 255, 2) : 1
    };
  }

  if (hex.length === 6 || hex.length === 8) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
      alpha: hex.length === 8 ? round(Number.parseInt(hex.slice(6, 8), 16) / 255, 2) : 1
    };
  }

  return null;
};

/** Formats any decimal number (e.g. 128) as a hexadecimal string (e.g. "08") */
const format = (number: number): string => {
  const hex = Math.round(number).toString(16);
  return hex.length < 2 ? `0${hex}` : hex;
};

/** Converts RGBA object to Hex6 or (if it has alpha channel) Hex8 string */
export const rgbToHex = (rgb: RgbColor): string => {
  const { r, g, b, alpha } = roundRgb(rgb);
  const alphaHex = alpha < 1 ? format(round(alpha * 255)) : '';
  return `#${format(r)}${format(g)}${format(b)}${alphaHex}`;
};
