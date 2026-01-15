import type { AnyColor } from '../types';
import type { Plugin } from '../extend';
import { mix as mixColor } from '../shared/manipulate';
import type { Colord as ColordInstance } from '../colord';

declare module '../colord' {
  interface Colord {
    /**
     * Produces a mixture of two colors through CIE LAB color space and returns a new Colord instance.
     */
    mix(color2: AnyColor | Colord, ratio?: number): Colord;

    /**
     * Generates a tints palette based on original color.
     */
    tints(count?: number): Colord[];

    /**
     * Generates a shades palette based on original color.
     */
    shades(count?: number): Colord[];

    /**
     * Generates a tones palette based on original color.
     */
    tones(count?: number): Colord[];
  }
}

/**
 * A plugin adding a color mixing utilities.
 */
export const mixPlugin: Plugin = (ColordClass): void => {
  ColordClass.prototype.mix = function mix(color2, ratio = 0.5) {
    const instance2 = color2 instanceof ColordClass ? color2 : new ColordClass(color2);

    const mixture = mixColor(this.toRgb(), instance2.toRgb(), ratio);
    return new ColordClass(mixture);
  };

  /**
   * Generate a palette from mixing a source color with another.
   */
  function mixPalette(source: ColordInstance, hex: string, count = 5): ColordInstance[] {
    const palette = [];
    const step = 1 / (count - 1);
    for (let i = 0; i <= count - 1; i += 1) {
      palette.push(source.mix(hex, step * i));
    }
    return palette;
  }

  ColordClass.prototype.tints = function tints(count) {
    return mixPalette(this, '#fff', count);
  };

  ColordClass.prototype.shades = function shades(count) {
    return mixPalette(this, '#000', count);
  };

  ColordClass.prototype.tones = function tones(count) {
    return mixPalette(this, '#808080', count);
  };
};

export default mixPlugin;
