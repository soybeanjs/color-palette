import type { HwbColor } from '../types';
import type { Plugin } from '../extend';
import { parseHwb, parseHwbString, rgbToHwb, rgbToHwbString, roundHwb } from '../models/hwb';

declare module '@soybeanjs/colord' {
  interface Colord {
    /**
     * Converts a color to HWB (Hue-Whiteness-Blackness) color space and returns an object.
     * https://en.wikipedia.org/wiki/HWB_color_model
     */
    toHwb(): HwbColor;
    /**
     * Converts a color to HWB (Hue-Whiteness-Blackness) color space and returns a string.
     * https://www.w3.org/TR/css-color-4/#the-hwb-notation
     */
    toHwbString(): string;
  }
}

/**
 * A plugin adding support for HWB (Hue-Whiteness-Blackness) color model.
 * https://en.wikipedia.org/wiki/HWB_color_model
 * https://www.w3.org/TR/css-color-4/#the-hwb-notation
 */
export const hwbPlugin: Plugin = (ColordClass, parsers): void => {
  ColordClass.prototype.toHwb = function toHwb() {
    return roundHwb(rgbToHwb(this.rgb));
  };

  ColordClass.prototype.toHwbString = function toHwbString() {
    return rgbToHwbString(this.rgb);
  };

  parsers.string.push([parseHwbString, 'hwb']);
  parsers.object.push([parseHwb, 'hwb']);
};

export default hwbPlugin;
