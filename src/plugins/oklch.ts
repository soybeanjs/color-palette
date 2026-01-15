import type { OklchColor } from '../types';
import type { Plugin } from '../extend';
import { parseOklch, parseOklchString, rgbToOklch, roundOklch } from '../models/oklch';

declare module '@soybeanjs/colord' {
  interface Colord {
    toOklch(): OklchColor;
  }
}

/**
 * A plugin adding support for OKLCH colorspace.
 * https://bottosson.github.io/posts/oklab/
 */
export const oklchPlugin: Plugin = (ColordClass, parsers): void => {
  ColordClass.prototype.toOklch = function toOklch() {
    return roundOklch(rgbToOklch(this.rgb));
  };

  parsers.string.push([parseOklchString, 'oklch']);
  parsers.object.push([parseOklch, 'oklch']);
};

export default oklchPlugin;
