import { ALPHA_PRECISION } from './constants';
import { rgbToHex } from './models/hex';
import { rgbToRgbString, roundRgb } from './models/rgb';
import { rgbToHsl, rgbToHslString, roundHsl } from './models/hsl';
import { rgbToHsv, roundHsv } from './models/hsv';
import { changeAlpha, getBrightness, invert, lighten, parse, saturate } from './shared';
import { round } from './utils';
import type { AnyColor, HslColor, HsvColor, Input, InputSource, RgbColor } from './types';

/**
 * Parses the given input color and creates a new `Colord` instance.
 * See accepted input formats: https://github.com/omgovich/colord#color-parsing
 */
export const colord = (input: AnyColor | Colord): Colord => {
  if (input instanceof Colord) return input;
  return new Colord(input);
};

export class Colord {
  private readonly parsed: RgbColor | null;
  readonly rgb: RgbColor;
  private readonly source?: InputSource;

  constructor(input: AnyColor) {
    // Internal color format is RGBA object.
    // We do not round the internal RGBA numbers for better conversion accuracy.
    const [rgb, format] = parse(input as Input);
    this.parsed = rgb;
    this.rgb = this.parsed || { r: 0, g: 0, b: 0, alpha: 1 };

    // Cache original input for lossless conversion back to original format
    if (format && this.parsed) {
      this.source = { format, input: input as Input };
    }
  }

  /**
   * Get the original input format if available
   * @internal
   */
  public getSource(): InputSource | undefined {
    return this.source;
  }

  /**
   * Returns a boolean indicating whether or not an input has been parsed successfully.
   * Note: If parsing is unsuccessful, Colord defaults to black (does not throws an error).
   */
  public isValid(): boolean {
    return this.parsed !== null;
  }

  /**
   * Returns the brightness of a color (from 0 to 1).
   * The calculation logic is modified from WCAG.
   * https://www.w3.org/TR/AERT/#color-contrast
   */
  public brightness(): number {
    return round(getBrightness(this.rgb), 2);
  }

  /**
   * Same as calling `brightness() < 0.5`.
   */
  public isDark(): boolean {
    return getBrightness(this.rgb) < 0.5;
  }

  /**
   * Same as calling `brightness() >= 0.5`.
   * */
  public isLight(): boolean {
    return getBrightness(this.rgb) >= 0.5;
  }

  /**
   * Returns the hexadecimal representation of a color.
   * When the alpha channel value of the color is less than 1,
   * it outputs #rrggbbaa format instead of #rrggbb.
   */
  public toHex(): string {
    return rgbToHex(this.rgb);
  }

  /**
   * Converts a color to RGB color space and returns an object.
   * Always includes an alpha value from 0 to 1.
   */
  public toRgb(): RgbColor {
    return roundRgb(this.rgb);
  }

  /**
   * Converts a color to RGB color space and returns a string representation.
   * Outputs an alpha value only if it is less than 1.
   */
  public toRgbString(): string {
    return rgbToRgbString(this.rgb);
  }

  /**
   * Converts a color to HSL color space and returns an object.
   * Always includes an alpha value from 0 to 1.
   */
  public toHsl(): HslColor {
    return roundHsl(rgbToHsl(this.rgb));
  }

  /**
   * Converts a color to HSL color space and returns a string representation.
   * Always includes an alpha value from 0 to 1.
   */
  public toHslString(): string {
    return rgbToHslString(this.rgb);
  }

  /**
   * Converts a color to HSV color space and returns an object.
   * Always includes an alpha value from 0 to 1.
   */
  public toHsv(): HsvColor {
    return roundHsv(rgbToHsv(this.rgb));
  }

  /**
   * Creates a new instance containing an inverted (opposite) version of the color.
   */
  public invert(): Colord {
    return colord(invert(this.rgb));
  }

  /**
   * Increases the HSL saturation of a color by the given amount.
   */
  public saturate(amount = 0.1): Colord {
    return colord(saturate(this.rgb, amount));
  }

  /**
   * Decreases the HSL saturation of a color by the given amount.
   */
  public desaturate(amount = 0.1): Colord {
    return colord(saturate(this.rgb, -amount));
  }

  /**
   * Makes a gray color with the same lightness as a source color.
   */
  public grayscale(): Colord {
    return colord(saturate(this.rgb, -1));
  }

  /**
   * Increases the HSL lightness of a color by the given amount.
   */
  public lighten(amount = 0.1): Colord {
    return colord(lighten(this.rgb, amount));
  }

  /**
   * Increases the HSL lightness of a color by the given amount.
   */
  public darken(amount = 0.1): Colord {
    return colord(lighten(this.rgb, -amount));
  }

  /**
   * Changes the HSL hue of a color by the given amount.
   */
  public rotate(amount = 15): Colord {
    return this.hue(this.hue() + amount);
  }

  /**
   * Allows to get or change an alpha channel value.
   */
  public alpha(): number;
  public alpha(value: number): Colord;
  public alpha(value?: number): Colord | number {
    if (typeof value === 'number') return colord(changeAlpha(this.rgb, value));
    return round(this.rgb.alpha, ALPHA_PRECISION);
  }

  /**
   * Allows to get or change a hue value.
   */
  public hue(): number;
  public hue(value: number): Colord;
  public hue(value?: number): Colord | number {
    const hsl = rgbToHsl(this.rgb);
    if (typeof value === 'number') {
      return colord({ h: value, s: hsl.s, l: hsl.l, alpha: hsl.alpha });
    }
    return round(hsl.h);
  }

  /**
   * Determines whether two values are the same color.
   */
  public isEqual(color: AnyColor | Colord): boolean {
    return this.toHex() === colord(color).toHex();
  }
}
