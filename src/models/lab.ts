import { ALPHA_PRECISION, D50, M_D50_TO_D65, M_D65_TO_D50 } from '../constants';
import { clamp, isPresent, mul3x3, parseAlpha, round } from '../utils';
import type { InputObject, LabColor, RgbColor, XyzColor } from '../types';
import { rgbToXyz, xyzToRgb } from './xyz';

const EPSILON = 216 / 24389; // 0.008856
const KAPPA = 24389 / 27; // 903.3

/**
 * Clamps LAB axis values as defined in CSS Color Level 4 specs.
 * https://www.w3.org/TR/css-color-4/#specifying-lab-lch
 */
export const clampLab = (lab: LabColor): LabColor => {
  const { l, a, b, alpha } = lab;

  return {
    l: clamp(l, 0, 100),
    a: clamp(a, -128, 127),
    b: clamp(b, -128, 127),
    alpha: clamp(alpha)
  };
};

export const roundLab = (lab: LabColor): LabColor => {
  const { l, a, b, alpha } = lab;

  return {
    l: round(l, 3),
    a: round(a, 3),
    b: round(b, 3),
    alpha: round(alpha, ALPHA_PRECISION)
  };
};

/**
 * Performs RGB → CIEXYZ → LAB color conversion
 * https://www.w3.org/TR/css-color-4/#color-conversion-code
 */
export const rgbToLab = (rgb: RgbColor): LabColor => {
  // Compute XYZ scaled relative to D50 reference white
  const xyzD65 = rgbToXyz(rgb);
  const { alpha } = xyzD65;

  const [x, y, z] = mul3x3(M_D65_TO_D50, [xyzD65.x, xyzD65.y, xyzD65.z]);

  const lab = xyzToLabRaw({
    x,
    y,
    z,
    alpha
  });

  return lab;
};

/**
 * Performs LAB → CIEXYZ → RGB color conversion
 * https://www.w3.org/TR/css-color-4/#color-conversion-code
 */
export const labToRgb = (lab: LabColor): RgbColor => {
  const xyzD50 = labToXyzRaw(lab);

  const [x, y, z] = mul3x3(M_D50_TO_D65, [xyzD50.x, xyzD50.y, xyzD50.z]);

  return xyzToRgb({
    x,
    y,
    z,
    alpha: lab.alpha
  });
};

function xyzToLabRaw(xyz: XyzColor): LabColor {
  const { x, y, z, alpha } = xyz;
  const xr = x / D50.x;
  const yr = y / D50.y;
  const zr = z / D50.z;

  const f = (t: number) => (t > EPSILON ? Math.cbrt(t) : (KAPPA * t + 16) / 116);

  const fx = f(xr);
  const fy = f(yr);
  const fz = f(zr);

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return {
    l,
    a,
    b,
    alpha
  };
}

// Lab to XYZ (D50)
function labToXyzRaw(lab: LabColor): XyzColor {
  const { l, a, b, alpha } = lab;
  const fy = (l + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const f3 = (t: number) => (t * t * t > EPSILON ? t * t * t : (116 * t - 16) / KAPPA);

  const xr = f3(fx);
  const yr = l > KAPPA * EPSILON ? ((l + 16) / 116) ** 3 : l / KAPPA;
  const zr = f3(fz);

  return {
    x: xr * D50.x,
    y: yr * D50.y,
    z: zr * D50.z,
    alpha
  };
}

export const parseLab = ({ l, a, b, alpha = 1 }: InputObject): RgbColor | null => {
  if (!isPresent(l) || !isPresent(a) || !isPresent(b)) return null;

  const lab = clampLab({
    l: Number(l),
    a: Number(a),
    b: Number(b),
    alpha: Number(alpha)
  });

  return labToRgb(lab);
};

/**
 * Parsing syntax: oklab(L a b [/ alpha])
 * - L: <number|percentage> [0,100]
 * - a: <number> [-125,125]
 * - b: <number> [-125,125]
 * - alpha: <number|percentage> [0,1]
 */
const labMatcher = /^lab\(\s*([+-]?[\d.]+)%?\s+([+-]?[\d.]+)\s+([+-]?[\d.]+)(?:\s*\/\s*([+-]?[\d.]+%?))?\s*\)$/i;

export const parseLabString = (input: string): RgbColor | null => {
  const match = labMatcher.exec(input);
  if (!match) return null;

  const [_, l, a, b, alpha] = match;

  const lab = clampLab({
    l: Number.parseFloat(l),
    a: Number.parseFloat(a),
    b: Number.parseFloat(b),
    alpha: parseAlpha(alpha)
  });

  return labToRgb(lab);
};

export const rgbToLabString = (rgb: RgbColor): string => {
  const { l, a, b, alpha } = rgbToLab(rgb);

  return alpha < 1 ? `lab(${l}% ${a} ${b} / ${alpha})` : `lab(${l}% ${a} ${b})`;
};
