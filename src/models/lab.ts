import { ALPHA_PRECISION, D50, M_D50_TO_D65, M_D65_TO_D50 } from '../constants';
import { clamp, isPresent, mul3x3, parseAlpha, round } from '../utils';
import type { InputObject, InputSource, LabColor, RgbColor, XyzColor } from '../types';
import { rgbToXyz, xyzToRgb } from './xyz';
import { clampRgb } from './rgb';

const EPSILON = 216 / 24389; // 0.008856
const KAPPA = 24389 / 27; // 903.3

/**
 * Clamps LAB axis values as defined in CSS Color Level 4 specs.
 * https://www.w3.org/TR/css-color-4/#specifying-lab-lch
 * Note: a and b can theoretically go beyond [-128, 127], extended to [-160, 160] for wider gamut
 */
export const clampLab = (lab: LabColor): LabColor => {
  const { l, a, b, alpha } = lab;

  return {
    l: clamp(l, 0, 100),
    a: clamp(a, -160, 160),
    b: clamp(b, -160, 160),
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
 * Convert LAB to RGB without gamut checking (internal helper)
 */
const labToRgbDirect = (lab: LabColor): RgbColor => {
  const xyzD50 = labToXyzRaw(lab);

  const [x, y, z] = mul3x3(M_D50_TO_D65, [xyzD50.x, xyzD50.y, xyzD50.z]);

  return xyzToRgb({
    x,
    y,
    z,
    alpha: lab.alpha
  });
};

/**
 * Check if RGB is within sRGB gamut
 * Note: RGB values are in [0, 255] range
 */
const isRgbInGamut = (rgb: RgbColor, epsilon = 0.01): boolean => {
  return (
    rgb.r >= -epsilon &&
    rgb.r <= 255 + epsilon &&
    rgb.g >= -epsilon &&
    rgb.g <= 255 + epsilon &&
    rgb.b >= -epsilon &&
    rgb.b <= 255 + epsilon
  );
};

/**
 * Binary search to find maximum chroma that fits in sRGB gamut for LAB
 * Similar to LCH's findGamutChroma
 * @param l - Lightness (0-100)
 * @param hue - Hue angle in radians (atan2(b, a))
 * @param alpha - Alpha (0-1)
 * @returns Maximum chroma that fits in sRGB gamut
 */
const findGamutChromaForLab = (l: number, hue: number, alpha: number): number => {
  let min = 0;
  // LAB chroma max is ~150-200
  let max = 150;
  // Higher precision for chroma
  const epsilon = 0.01;

  // Quick check if even max chroma is in gamut
  const maxA = max * Math.cos(hue);
  const maxB = max * Math.sin(hue);
  const maxRgb = labToRgbDirect({ l, a: maxA, b: maxB, alpha });
  if (isRgbInGamut(maxRgb)) {
    return max;
  }

  // Binary search for maximum in-gamut chroma
  while (max - min > epsilon) {
    const mid = (min + max) / 2;
    const a = mid * Math.cos(hue);
    const b = mid * Math.sin(hue);
    const rgb = labToRgbDirect({ l, a, b, alpha });

    if (isRgbInGamut(rgb)) {
      min = mid;
    } else {
      max = mid;
    }
  }

  return min;
};

/**
 * Performs LAB → CIEXYZ → RGB color conversion with gamut mapping
 * https://www.w3.org/TR/css-color-4/#color-conversion-code
 *
 * Similar to LCH, if the color is out of sRGB gamut, reduce chroma
 * while preserving lightness and hue
 */
export const labToRgb = (lab: LabColor): RgbColor => {
  const { l, a, b, alpha } = lab;

  // Try direct conversion first
  let rgb = labToRgbDirect(lab);

  // If out of gamut, reduce chroma to fit
  if (!isRgbInGamut(rgb)) {
    // Calculate hue angle and current chroma
    const chroma = Math.sqrt(a * a + b * b);
    if (chroma > 0.0001) {
      const hue = Math.atan2(b, a);
      const maxChroma = findGamutChromaForLab(l, hue, alpha);
      const newA = maxChroma * Math.cos(hue);
      const newB = maxChroma * Math.sin(hue);
      rgb = labToRgbDirect({ l, a: newA, b: newB, alpha });
    }
  }

  // Clamp to handle floating point errors
  return clampRgb(rgb);
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

export const parseLab = ({ l, a, b, alpha = 1 }: InputObject): LabColor | null => {
  if (!isPresent(l) || !isPresent(a) || !isPresent(b)) return null;

  return clampLab({
    l: Number(l),
    a: Number(a),
    b: Number(b),
    alpha: Number(alpha)
  });
};

export const parseLabToRgb = (input: InputObject): RgbColor | null => {
  const lab = parseLab(input);

  if (!lab) return null;

  return labToRgb(lab);
};

/**
 * Parsing syntax: lab(L a b [/ alpha])
 * - L: <number|percentage> [0,100]
 * - a: <number> [-125,125]
 * - b: <number> [-125,125]
 * - alpha: <number|percentage> [0,1]
 */
const labMatcher = /^lab\(\s*([+-]?[\d.]+)%?\s+([+-]?[\d.]+)\s+([+-]?[\d.]+)(?:\s*\/\s*([+-]?[\d.]+%?))?\s*\)$/i;

export const parseLabString = (input: string): LabColor | null => {
  const match = labMatcher.exec(input);
  if (!match) return null;

  const [_, l, a, b, alpha] = match;

  return clampLab({
    l: Number.parseFloat(l),
    a: Number.parseFloat(a),
    b: Number.parseFloat(b),
    alpha: parseAlpha(alpha)
  });
};

export const parseLabStringToRgb = (input: string): RgbColor | null => {
  const lab = parseLabString(input);

  if (!lab) return null;

  return labToRgb(lab);
};

export const toLabString = (lab: LabColor): string => {
  const { l, a, b, alpha } = roundLab(lab);

  return alpha < 1 ? `lab(${l}% ${a} ${b} / ${alpha})` : `lab(${l}% ${a} ${b})`;
};

export const rgbToLabString = (rgb: RgbColor): string => {
  const lab = rgbToLab(rgb);

  return toLabString(lab);
};

export const parseLabBySource = (source?: InputSource): LabColor | null => {
  if (!source || source.format !== 'lab') return null;

  const { input } = source;

  if (typeof input === 'string') {
    return parseLabString(input);
  }

  if (typeof input === 'object') {
    return parseLab(input);
  }

  return null;
};

export const toLabStringBySource = (source?: InputSource): string | null => {
  const lab = parseLabBySource(source);

  if (!lab) return null;

  return toLabString(lab);
};
