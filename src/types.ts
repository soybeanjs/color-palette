type WithAlpha<O> = O & { alpha: number };

export type RgbColor = WithAlpha<{
  r: number;
  g: number;
  b: number;
}>;

export type HslColor = WithAlpha<{
  h: number;
  s: number;
  l: number;
}>;

export type HsvColor = WithAlpha<{
  h: number;
  s: number;
  v: number;
}>;

export type HwbColor = WithAlpha<{
  h: number;
  w: number;
  b: number;
}>;

export type XyzColor = WithAlpha<{
  x: number;
  y: number;
  z: number;
}>;

export type LabColor = WithAlpha<{
  l: number;
  a: number;
  b: number;
}>;

export type LchColor = WithAlpha<{
  l: number;
  c: number;
  h: number;
}>;

export type CmykColor = WithAlpha<{
  c: number;
  m: number;
  y: number;
  k: number;
}>;

export type OklabColor = WithAlpha<{
  l: number;
  a: number;
  b: number;
}>;

export type OklchColor = WithAlpha<{
  l: number;
  c: number;
  h: number;
}>;

type PartialAlpha<O> = Omit<O, 'alpha'> & { alpha?: number };

export type ObjectColor =
  | PartialAlpha<RgbColor>
  | PartialAlpha<HslColor>
  | PartialAlpha<HsvColor>
  | PartialAlpha<HwbColor>
  | PartialAlpha<XyzColor>
  | PartialAlpha<LabColor>
  | PartialAlpha<LchColor>
  | PartialAlpha<CmykColor>
  | PartialAlpha<OklabColor>
  | PartialAlpha<OklchColor>;

export type AnyColor = string | ObjectColor;

export type InputObject = Record<string, unknown>;

export type Format =
  | 'name'
  | 'hex'
  | 'rgb'
  | 'lrgb'
  | 'hsl'
  | 'hsv'
  | 'hwb'
  | 'xyz'
  | 'lab'
  | 'lch'
  | 'cmyk'
  | 'oklab'
  | 'oklch';

export type Input = string | InputObject;

export interface InputSource {
  format: Format;
  input: Input;
}

export type ParseResult = [RgbColor, Format];

export type ParseFunction<I extends Input> = (input: I) => RgbColor | null;

export type Parser<I extends Input> = [ParseFunction<I>, Format];

export type Parsers = {
  string: Array<Parser<string>>;
  object: Array<Parser<InputObject>>;
};

export type Vector3 = readonly [number, number, number];

/**
 * A 3x3 matrix represented as a tuple of 3 row tuples.
 * Used for linear color space transformations.
 *
 * @example
 * ```ts
 * const matrix: Matrix3x3 = [
 *   [1, 0, 0],
 *   [0, 1, 0],
 *   [0, 0, 1],
 * ];
 * ```
 */
export type Matrix3x3 = readonly [Vector3, Vector3, Vector3];

/**
 * the palette color level
 *
 * the main color level is 500
 */
export type PaletteColorLevel = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export type TailwindPaletteColorKey =
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

/**
 * the tailwind palette color
 *
 * the color format is `oklch` string
 */
export type TailwindPaletteColor = {
  [K in TailwindPaletteColorKey]: {
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
  paletteKey: TailwindPaletteColorKey;
  /** palette level */
  level: PaletteColorLevel;
  /** palette color */
  color: OutputColorMap[F];
  /** the color delta value */
  delta: number;
  /** palette colors */
  palette: Record<PaletteColorLevel, OutputColorMap[F]>;
}
