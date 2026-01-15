import { ANGLE_UNITS } from '../constants';
import type { Matrix3x3, Vector3 } from '../types';

export const isPresent = (value: unknown): boolean => {
  if (typeof value === 'string') return value.length > 0;
  if (typeof value === 'number') return true;
  return false;
};

/**
 * Rounds a number to the specified number of decimal places.
 * @param number - The number to round
 * @param digits - The number of decimal places (default: 0)
 * @returns The rounded number (converts -0 to 0)
 */
export const round = (number: number, digits = 0): number => {
  const base = 10 ** digits;
  return Math.round(base * number) / base + 0;
};

/**
 * Floors a number to the specified number of decimal places.
 * @param number - The number to floor
 * @param digits - The number of decimal places (default: 0)
 * @returns The floored number (converts -0 to 0)
 */
export const floor = (number: number, digits = 0): number => {
  const base = 10 ** digits;
  return Math.floor(base * number) / base + 0;
};

/**
 * Clamps a value between an upper and lower bound.
 * We use ternary operators because it makes the minified code
 * is 2 times shorter then `Math.min(Math.max(a,b),c)`
 * NaN is clamped to the lower bound
 */
export const clamp = (number: number, min = 0, max = 1): number => {
  // return number > max ? max : number > min ? number : min;
  if (number > max) return max;
  if (number < min) return min;
  return number;
};

/**
 * Processes and clamps a degree (angle) value properly.
 * Any `NaN` or `Infinity` will be converted to `0`.
 * Examples: -1 => 359, 361 => 1
 */
export const clampHue = (degrees: number): number => {
  const degree = Number.isFinite(degrees) ? degrees % 360 : 0;

  return degree > 0 ? degree : degree + 360;
};

/**
 * Converts a hue value to degrees from 0 to 360 inclusive.
 */
export const parseHue = (value: string, unit = 'deg'): number => {
  return Number.parseFloat(value) * (ANGLE_UNITS[unit] || 1);
};

export function mul3x3(m: Matrix3x3, v: Vector3): Vector3 {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]
  ];
}

// parse alpha value
export function parseAlpha(alpha: string | undefined): number {
  if (!alpha) return 1;

  let value = Number.parseFloat(alpha);

  // parse percentage
  if (alpha.endsWith('%')) {
    value /= 100;
  }

  return value;
}
