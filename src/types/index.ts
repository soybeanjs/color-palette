/**
 * the color palette number
 *
 * the main color number is 500
 */
export type ColorPaletteNumber = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

/**
 * the color palette
 */
export type ColorPalette = Record<ColorPaletteNumber, string>;

/** the color palette family */
export interface ColorPaletteFamily {
	/** the color palette family name */
	name: string;
	/** the color palettes */
	palette: ColorPalette;
}

export interface ColorPaletteItem {
	number: ColorPaletteNumber;
	hex: string;
}

export interface ColorPaletteItemWithDelta extends ColorPaletteItem {
	delta: number;
}

/** the color palette with delta */
export interface ColorPaletteFamilyWithDelta extends ColorPaletteFamily {
	/** the delta of the color palette */
	delta: number;
}

/** the color palette family with nearest palette */
export interface ColorPaletteFamilyWithNearestPalette extends ColorPaletteFamily {
	/** the matched nearest palette */
	matched: ColorPaletteItemWithDelta;
	/** the matched nearest lightness palette */
	lightness: ColorPaletteItemWithDelta;
}

/** the matched color palette family */
export interface MatchedColorPaletteFamily extends ColorPaletteItem, ColorPaletteFamily {}
