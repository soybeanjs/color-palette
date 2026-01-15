import type { OklabColor } from '../types';
import type { Plugin } from '../extend';
import { parseOklab, parseOklabString, rgbToOklab, rgbToOklabString, roundOklab } from '../models/oklab';

declare module '@soybeanjs/colord' {
  interface Colord {
    toOklab(): OklabColor;
    toOklabString(): string;
  }
}

/**
 * A plugin adding support for OKLAB colorspace.
 * https://bottosson.github.io/posts/oklab/
 */
export const oklabPlugin: Plugin = (ColordClass, parsers): void => {
  ColordClass.prototype.toOklab = function toOklab() {
    return roundOklab(rgbToOklab(this.rgb));
  };

  ColordClass.prototype.toOklabString = function toOklabString() {
    return rgbToOklabString(this.rgb);
  };

  parsers.string.push([parseOklabString, 'oklab']);
  parsers.object.push([parseOklab, 'oklab']);
};

export default oklabPlugin;
