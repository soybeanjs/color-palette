import { colord } from '../colord';
import { extend } from '../extend';
import { labPlugin } from '../plugins/lab';
import { keysOf } from '../shared';
import type { AnyColor } from '../types';
import { tailwindPalette } from './constant';
import { formatOutput } from './generate';
import type { NearestPalette, OutputColorMap, OutputFormat, PaletteColorLevel } from './types';

extend([labPlugin]);

/**
 * find the nearest palette color
 * @param input - the input color
 * @param format - the format of the output color
 * @returns the nearest palette color
 */
export function generateNearestPalette<F extends OutputFormat>(input: AnyColor, format: F = 'oklch' as F) {
  const inputColor = colord(input);

  const current = formatOutput(inputColor.toOklch(), format);

  let minDelta = Number.POSITIVE_INFINITY;
  const result: NearestPalette<F> = {
    current,
    paletteKey: 'slate',
    level: 500,
    color: current,
    delta: 0,
    palette: {} as Record<PaletteColorLevel, OutputColorMap[F]>
  };

  let isFound = false;

  keysOf(tailwindPalette).forEach(paletteKey => {
    if (isFound) return;

    const palette = tailwindPalette[paletteKey];

    keysOf(palette).forEach(level => {
      if (isFound) return;

      const color = palette[level];
      const delta = inputColor.delta(color);
      if (delta < minDelta) {
        minDelta = delta;

        Object.assign(result, {
          paletteKey,
          level,
          color,
          delta
        });

        if (minDelta === 0) {
          isFound = true;
        }
      }
    });
  });

  result.color = formatOutput(result.color, format);

  const palette = tailwindPalette[result.paletteKey];

  result.palette = keysOf(palette).reduce(
    (acc, level) => {
      acc[level] = formatOutput(palette[level], format);
      return acc;
    },
    {} as Record<PaletteColorLevel, OutputColorMap[F]>
  );

  return result;
}
