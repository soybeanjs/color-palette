import type { XyzColor } from '../types';
import type { Plugin } from '../extend';
import { parseXyz, rgbToXyz, roundXyz } from '../models/xyz';

declare module '../colord' {
  interface Colord {
    toXyz(): XyzColor;
  }
}

/**
 * A plugin adding support for CIE XYZ colorspace.
 * Wikipedia: https://en.wikipedia.org/wiki/CIE_1931_color_space
 * Helpful article: https://www.sttmedia.com/colormodel-xyz
 */
export const xyzPlugin: Plugin = (ColordClass, parsers): void => {
  ColordClass.prototype.toXyz = function toXyz() {
    return roundXyz(rgbToXyz(this.rgb));
  };

  parsers.object.push([parseXyz, 'xyz']);
};

export default xyzPlugin;
