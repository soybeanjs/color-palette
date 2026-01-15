import type { AnyColor, LabColor } from '../types';
import type { Plugin } from '../extend';
import { parseLab, parseLabString, rgbToLab, roundLab } from '../models/lab';
import { getDeltaE2000 } from '../shared/get';
import { clamp, round } from '../utils';

declare module '../colord' {
  interface Colord {
    /**
     * Converts a color to CIELAB color space and returns an object.
     * The object always includes `alpha` value [0, 1].
     */
    toLab(): LabColor;

    /**
     * Calculates the perceived color difference for two colors according to
     * [Delta E2000](https://en.wikipedia.org/wiki/Color_difference#CIEDE2000).
     * Returns a value in [0, 1] range.
     */
    delta(color?: AnyColor | Colord): number;
  }
}

/**
 * A plugin adding support for CIELAB color space.
 * https://en.wikipedia.org/wiki/CIELAB_color_space
 */
export const labPlugin: Plugin = (ColordClass, parsers): void => {
  ColordClass.prototype.toLab = function toLab() {
    return roundLab(rgbToLab(this.rgb));
  };

  ColordClass.prototype.delta = function delta(color = '#FFF') {
    const compared = color instanceof ColordClass ? color : new ColordClass(color);
    const d = getDeltaE2000(this.toLab(), compared.toLab()) / 100;
    return clamp(round(d, 3));
  };

  parsers.object.push([parseLab, 'lab']);
  parsers.string.push([parseLabString, 'lab']);
};

export default labPlugin;
