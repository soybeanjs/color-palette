import type { OklabColor } from '../types';
import type { Plugin } from '../extend';
import {
  parseOklabBySource,
  parseOklabStringToRgb,
  parseOklabToRgb,
  rgbToOklab,
  rgbToOklabString,
  roundOklab,
  toOklabStringBySource
} from '../models/oklab';

declare module '../colord' {
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
    const source = this.getSource();

    const oklab = parseOklabBySource(source) || rgbToOklab(this.rgb);

    return roundOklab(oklab);
  };

  ColordClass.prototype.toOklabString = function toOklabString() {
    const source = this.getSource();

    return toOklabStringBySource(source) || rgbToOklabString(this.rgb);
  };

  parsers.string.push([parseOklabStringToRgb, 'oklab']);
  parsers.object.push([parseOklabToRgb, 'oklab']);
};

export default oklabPlugin;
