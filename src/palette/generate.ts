import { colord } from '../colord';
import { keysOf } from '../shared';
import type { AnyColor, OutputColorMap, OutputFormat, PaletteColorLevel } from '../types';

const paletteScales: Record<PaletteColorLevel, { l: number; c: number }> = {
  50: { l: 0.08, c: 0.065 },
  100: { l: 0.18, c: 0.15 },
  200: { l: 0.313, c: 0.276 },
  300: { l: 0.507, c: 0.491 },
  400: { l: 0.777, c: 0.771 },
  500: { l: 1.0, c: 1.0 },
  600: { l: 0.876, c: 1.145 },
  700: { l: 0.783, c: 1.136 },
  800: { l: 0.681, c: 0.93 },
  900: { l: 0.608, c: 0.682 },
  950: { l: 0.453, c: 0.425 }
};

/**
 * the gray colors use a fixed target lightness to ensure the light colors are sufficiently light
 */
const lightnessMap: Record<number, number> = {
  50: 0.985,
  100: 0.968,
  200: 0.924,
  300: 0.87,
  400: 0.707
};

/**
 * the gray colors use a fixed target lightness to ensure the dark colors are sufficiently dark
 */
const darkLightnessMap: Record<number, number> = {
  600: 0.802 * 0.556,
  700: 0.672 * 0.556,
  800: 0.495 * 0.556,
  900: 0.379 * 0.556,
  950: 0.25 * 0.556
};

/**
 * generate the palette
 * @param input - the base color
 * @param [format] - the format of the output color, default is 'oklch'
 * @returns the palette
 */
export function generatePalette<F extends OutputFormat>(input: AnyColor, format: F = 'oklch' as F) {
  const baseColor = colord(input);

  if (!baseColor.isValid()) {
    throw new Error('Invalid color value');
  }

  const { l: baseL, c: baseC, h: baseH, alpha } = baseColor.toOklch();

  const palette = {} as Record<PaletteColorLevel, OutputColorMap[F]>;

  /**
   * check if the color is grayish
   */
  const isGrayish = baseC < 0.05;

  /**
   * check if the color is near the red boundary (pink, rose, and other colors near red)
   */
  const isNearRedBoundary = baseH > 330 || baseH < 30;

  keysOf(paletteScales).forEach($level => {
    let l = baseL;
    let c = baseC;
    let h = baseH;
    const level = Number($level) as PaletteColorLevel;
    const scale = paletteScales[level];

    if (level < 500) {
      // the light colors (50-400): increase the lightness and decrease the chroma
      if (isGrayish) {
        l = lightnessMap[level];
      } else {
        // the colors use the relative proportion to calculate the lightness
        l = 1 - (1 - baseL) * scale.l;

        // the hue shift for the light colors
        const hueShift = getLightHueShift(baseH, scale.l);
        h = (baseH + hueShift + 360) % 360;
      }

      c = baseC * scale.c;
    }

    if (level > 500) {
      if (isGrayish) {
        l = darkLightnessMap[level];

        if (isNearRedBoundary && baseH > 330) {
          // when the color is near the red boundary, shift the hue to the warm color tone
          const hueShift = (1 - scale.l) * 10;
          h = (baseH + hueShift) % 360;
        }
      } else {
        l = baseL * scale.l;

        // use the adaptive strategy for the hue shift when the color is not grayish
        const hueShift = getDarkHueShift(baseH, scale.l);
        h = (baseH + hueShift + 360) % 360;
      }

      c = baseC * scale.c;
    }

    c = Math.max(0, c);

    const oklch = {
      l,
      c,
      h,
      alpha
    };

    palette[level] = formatOutput(oklch, format);
  });

  return palette;
}

/**
 * calculate the hue shift for the light colors
 * the light colors usually shift to the cold色调 (hue decrease)
 */
function getLightHueShift(h500: number, lightnessScale: number): number {
  // the shift amount is proportional to the lightness change
  const baseShift = (1 - lightnessScale) * 8;

  // the shift direction is different for different hue ranges
  if ((h500 >= 0 && h500 < 60) || h500 >= 330) {
    // red: shift to the cold色调 (decrease)
    return -baseShift;
  } else if (h500 >= 60 && h500 < 150) {
    // yellow-green: shift to the warm color tone (increase)
    return baseShift;
  } else if (h500 >= 150 && h500 < 210) {
    // green-cyan: shift to the warm color tone (increase)
    return baseShift * 0.7;
  } else if (h500 >= 210 && h500 < 270) {
    // blue: shift to the cold color tone (decrease)
    return -baseShift;
  }
  // purple: shift to the warm color tone (increase)
  return baseShift * 0.5;
}

/**
 * calculate the hue shift for the dark colors
 * the dark colors usually shift to the warm color tone (hue increase)
 */
function getDarkHueShift(h500: number, lightnessScale: number): number {
  // the shift amount is proportional to the lightness decrease
  const baseShift = (1 - lightnessScale) * 10;

  // the shift direction is different for different hue ranges
  if ((h500 >= 0 && h500 < 60) || h500 >= 330) {
    // red: shift to the warm color tone (increase)
    return baseShift * 0.3;
  } else if (h500 >= 60 && h500 < 150) {
    // yellow-green: shift to the cold color tone (decrease) - Yellow special treatment
    return -baseShift;
  } else if (h500 >= 150 && h500 < 210) {
    // green-cyan: shift to the warm color tone (increase)
    return baseShift * 0.3;
  } else if (h500 >= 210 && h500 < 270) {
    // blue: shift to the warm color tone (increase)
    return baseShift * 0.6;
  }
  // purple: shift to the cold color tone (decrease)
  return -baseShift * 0.2;
}

export function formatOutput<F extends OutputFormat>(input: AnyColor, format: F = 'oklch' as F) {
  const color = colord(input);

  let value: unknown = input;

  if (format === 'hex') {
    value = color.toHex();
  } else if (format === 'rgb') {
    value = color.toRgb();
  } else if (format === 'rgbString') {
    value = color.toRgbString();
  } else if (format === 'oklch') {
    value = color.toOklch();
  } else if (format === 'oklchString') {
    value = color.toOklchString();
  } else if (format === 'hsl') {
    value = color.toHsl();
  } else if (format === 'hslString') {
    value = color.toHslString();
  }

  return value as OutputColorMap[F];
}
