import type { OklchColor } from '../types';
import type { Plugin } from '../extend';
import {
  parseOklchBySource,
  parseOklchStringToRgb,
  parseOklchToRgb,
  rgbToOklch,
  rgbToOklchString,
  roundOklch,
  toOklchStringBySource
} from '../models/oklch';

declare module '../colord' {
  interface Colord {
    toOklch(): OklchColor;
    toOklchString(): string;
  }
}

/**
 * A plugin adding support for OKLCH colorspace.
 * https://bottosson.github.io/posts/oklab/
 */
export const oklchPlugin: Plugin = (ColordClass, parsers): void => {
  ColordClass.prototype.toOklch = function toOklch() {
    const source = this.getSource();

    const oklch = parseOklchBySource(source) || rgbToOklch(this.rgb);

    return roundOklch(oklch);
  };

  ColordClass.prototype.toOklchString = function toOklchString() {
    const source = this.getSource();

    return toOklchStringBySource(source) || rgbToOklchString(this.rgb);
  };

  parsers.string.push([parseOklchStringToRgb, 'oklch']);
  parsers.object.push([parseOklchToRgb, 'oklch']);
};

export default oklchPlugin;
