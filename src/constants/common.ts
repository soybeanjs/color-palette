/**
 * We used to work with 2 digits after the decimal point, but it wasn't accurate enough,
 * so the library produced colors that were perceived differently.
 */
export const ALPHA_PRECISION = 3;

/**
 * Valid CSS <angle> units.
 * https://developer.mozilla.org/en-US/docs/Web/CSS/angle
 */
export const ANGLE_UNITS: Record<string, number> = {
  grad: 360 / 400,
  turn: 360,
  rad: 360 / (Math.PI * 2)
};

/**
 * D65 Standard Illuminant white point.
 *
 * D65 represents average daylight (including ultraviolet)
 * with a correlated color temperature of approximately 6500K.
 * It is the standard white point for sRGB, Display P3, and most
 * web-related color spaces.
 *
 * Values are normalized with Y = 1.0.
 *
 * @see https://en.wikipedia.org/wiki/Illuminant_D65
 */
export const D65 = {
  /** X chromaticity coordinate */
  x: 0.95047,
  /** Y chromaticity coordinate (reference white luminance) */
  y: 1.0,
  /** Z chromaticity coordinate */
  z: 1.08883
} as const;

// D50 White Point
export const D50 = {
  x: 0.96422,
  y: 1.0,
  z: 0.82521
} as const;
