import type { LchColor } from '../types';
import type { Plugin } from '../extend';
import { parseLch, parseLchString, rgbToLch, rgbToLchString, roundLch } from '../models/lch';

declare module '@soybeanjs/colord' {
  interface Colord {
    /**
     * Converts a color to CIELCH (Lightness-Chroma-Hue) color space and returns an object.
     * https://lea.verou.me/2020/04/lch-colors-in-css-what-why-and-how/
     * https://en.wikipedia.org/wiki/CIELAB_color_space#Cylindrical_model
     */
    toLch(): LchColor;
    /**
     * Converts a color to CIELCH (Lightness-Chroma-Hue) color space and returns a string.
     * https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/lch()
     */
    toLchString(): string;
  }
}

/**
 * A plugin adding support for CIELCH color space.
 * https://lea.verou.me/2020/04/lch-colors-in-css-what-why-and-how/
 * https://en.wikipedia.org/wiki/CIELAB_color_space#Cylindrical_model
 */
export const lchPlugin: Plugin = (ColordClass, parsers): void => {
  ColordClass.prototype.toLch = function toLch() {
    return roundLch(rgbToLch(this.rgb));
  };

  ColordClass.prototype.toLchString = function toLchString() {
    return rgbToLchString(this.rgb);
  };

  parsers.string.push([parseLchString, 'lch']);
  parsers.object.push([parseLch, 'lch']);
};

export default lchPlugin;
