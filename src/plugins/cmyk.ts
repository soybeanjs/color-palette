import type { CmykColor } from '../types';
import type { Plugin } from '../extend';
import { parseCmyk, parseCmykString, rgbToCmyk, rgbToCmykString, roundCmyk } from '../models/cmyk';

declare module '@soybeanjs/colord' {
  interface Colord {
    /**
     * Converts a color to CMYK color space and returns an object.
     * https://drafts.csswg.org/css-color/#cmyk-colors
     * https://lea.verou.me/2009/03/cmyk-colors-in-css-useful-or-useless/
     */
    toCmyk(): CmykColor;
    /**
     * Converts a color to CMYK color space and returns a string.
     * https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/device-cmyk()
     */
    toCmykString(): string;
  }
}

/**
 * A plugin adding support for CMYK color space.
 * https://lea.verou.me/2009/03/cmyk-colors-in-css-useful-or-useless/
 * https://en.wikipedia.org/wiki/CMYK_color_model
 */
export const cmykPlugin: Plugin = (ColordClass, parsers): void => {
  ColordClass.prototype.toCmyk = function toCmyk() {
    return roundCmyk(rgbToCmyk(this.rgb));
  };

  ColordClass.prototype.toCmykString = function toCmykString() {
    return rgbToCmykString(this.rgb);
  };

  parsers.object.push([parseCmyk, 'cmyk']);
  parsers.string.push([parseCmykString, 'cmyk']);
};

export default cmykPlugin;
