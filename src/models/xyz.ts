import { ALPHA_PRECISION, D50, M_SRGB_TO_XYZ_D65, M_XYZ_D65_TO_SRGB } from '../constants';
import { clamp, isPresent, mul3x3, round } from '../utils';
import type { InputObject, RgbColor, XyzColor } from '../types';
import { clampRgb, linearRgbToRgb, rgbToLinearRgb } from './rgb';

/**
 * Limits XYZ axis values assuming XYZ is relative to D50.
 */
export const clampXyz = (xyz: XyzColor): XyzColor => {
  const { x, y, z, alpha } = xyz;

  return {
    x: clamp(x, 0.0001, D50.x),
    y: clamp(y, 0.0001, D50.y),
    z: clamp(z, 0.0001, D50.z),
    alpha: clamp(alpha)
  };
};

export const roundXyz = (xyz: XyzColor): XyzColor => {
  const { x, y, z, alpha } = xyz;

  return {
    x: round(x, 4),
    y: round(y, 4),
    z: round(z, 4),
    alpha: round(alpha, ALPHA_PRECISION)
  };
};

/**
 * Converts an CIE XYZ color (D50) to RGBA color space (D65)
 * https://www.w3.org/TR/css-color-4/#color-conversion-code
 */
export const xyzToRgb = (xyz: XyzColor): RgbColor => {
  const { x, y, z, alpha } = xyz;

  const [r, g, b] = mul3x3(M_XYZ_D65_TO_SRGB, [x, y, z]);

  const linearRgb: RgbColor = {
    r,
    g,
    b,
    alpha
  };

  const rgb = linearRgbToRgb(linearRgb);

  return clampRgb(rgb);
};

/**
 * Converts an RGB color (D65) to CIE XYZ (D50)
 * https://image-engineering.de/library/technotes/958-how-to-convert-between-srgb-and-ciexyz
 */
export const rgbToXyz = (rgb: RgbColor): XyzColor => {
  const { r, g, b, alpha } = rgbToLinearRgb(rgb);

  const [x, y, z] = mul3x3(M_SRGB_TO_XYZ_D65, [r, g, b]);

  // Convert an array of linear-light sRGB values to CIE XYZ
  // using sRGB own white (D65 no chromatic adaptation)
  const xyz: XyzColor = {
    x,
    y,
    z,
    alpha
  };

  return clampXyz(xyz);
};

export const parseXyz = ({ x, y, z, alpha = 1 }: InputObject): RgbColor | null => {
  if (!isPresent(x) || !isPresent(y) || !isPresent(z)) return null;

  const xyz = clampXyz({
    x: Number(x),
    y: Number(y),
    z: Number(z),
    alpha: Number(alpha)
  });

  return xyzToRgb(xyz);
};
