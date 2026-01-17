import type { HslColor, OklchColor, RgbColor } from '../types';

/**
 * the palette color level
 *
 * the main color level is 500
 */
export type PaletteColorLevel = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export type TailwindPaletteKey =
  | 'slate'
  | 'gray'
  | 'zinc'
  | 'neutral'
  | 'stone'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose';

export type TailwindPaletteLevelColorKey = `${TailwindPaletteKey}.${PaletteColorLevel}`;

/**
 * the tailwind palette
 *
 * the color format is `oklch` string
 */
export type TailwindPalette = {
  [K in TailwindPaletteKey]: {
    [L in PaletteColorLevel]: string;
  };
};

export type OutputColorMap = {
  hex: string;
  rgb: RgbColor;
  rgbString: string;
  oklch: OklchColor;
  oklchString: string;
  hsl: HslColor;
  hslString: string;
};

export type OutputFormat = keyof OutputColorMap;

export interface NearestPalette<F extends OutputFormat> {
  /** current color */
  current: OutputColorMap[F];
  /** palette color key */
  paletteKey: TailwindPaletteKey;
  /** palette level */
  level: PaletteColorLevel;
  /** palette color */
  color: OutputColorMap[F];
  /** the color delta value */
  delta: number;
  /** palette colors */
  palette: Record<PaletteColorLevel, OutputColorMap[F]>;
}
