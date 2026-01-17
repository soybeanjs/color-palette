import { writeFile } from 'node:fs/promises';
import { tailwindPalette } from '../src/palette/constant';
import { colord } from '../src/colord';
import { keysOf } from '../src/shared';

async function generateHsl() {
  const result: Record<string, Record<string, string>> = {};

  keysOf(tailwindPalette).forEach(key => {
    result[key] = {};

    keysOf(tailwindPalette[key]).forEach(level => {
      const { h, s, l } = colord(tailwindPalette[key][level]).toHsl();

      result[key][level] = `hsl(${h}, ${s}%, ${l}%)`;
    });
  });

  writeFile('hsl.json', JSON.stringify(result, null, 2));
}

generateHsl();
