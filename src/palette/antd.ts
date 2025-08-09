import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';
import type { AnyColor, HsvColor } from 'colord';
import type { ColorPaletteNumber } from '../types';

extend([mixPlugin]);

/** Hue step */
const hueStep = 2;
/** Saturation step, light color part */
const saturationStep = 16;
/** Saturation step, dark color part */
const saturationStep2 = 5;
/** Brightness step, light color part */
const brightnessStep1 = 5;
/** Brightness step, dark color part */
const brightnessStep2 = 15;
/** Light color count, main color up */
const lightColorCount = 5;
/** Dark color count, main color down */
const darkColorCount = 4;

const colorNumberMap: Record<ColorPaletteNumber, number> = {
	50: 1,
	100: 2,
	200: 3,
	300: 4,
	400: 5,
	500: 6,
	600: 7,
	700: 8,
	800: 9,
	900: 10,
	950: 11
};

/** dark color number and opacity */
const darkColorOpacity: { number: ColorPaletteNumber; opacity: number }[] = [
	{ number: 600, opacity: 0.15 },
	{ number: 500, opacity: 0.25 },
	{ number: 400, opacity: 0.3 },
	{ number: 400, opacity: 0.45 },
	{ number: 400, opacity: 0.65 },
	{ number: 400, opacity: 0.85 },
	{ number: 400, opacity: 0.9 },
	{ number: 300, opacity: 0.93 },
	{ number: 200, opacity: 0.95 },
	{ number: 100, opacity: 0.97 },
	{ number: 50, opacity: 0.98 }
];

/**
 * Generate ant-design color palette
 *
 * @param color - Color
 * @param darkTheme - Whether to generate dark theme color palette
 * @param darkThemeMixColor - Dark theme mix color (default: #141414)
 */
export function generateAntDesignPalette(color: AnyColor, darkTheme = false, darkThemeMixColor = '#141414') {
	const numbers: ColorPaletteNumber[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

	const patterns = numbers.map(num => generateAntDesignPaletteByNumber(color, num));

	if (darkTheme) {
		const darkPatterns = darkColorOpacity.map(({ number, opacity }) => {
			const index = colorNumberMap[number];

			const darkColor = colord(darkThemeMixColor).mix(colord(patterns[index]), opacity).toHex();

			return darkColor;
		});

		return darkPatterns;
	}

	return patterns;
}

/**
 * Generate ant-design color palette by number
 *
 * @param color - Color
 * @param num - The color number of color palette
 * @returns Hex color
 */
function generateAntDesignPaletteByNumber(color: AnyColor, num: ColorPaletteNumber) {
	const colorObj = colord(color);

	if (!colorObj.isValid()) {
		throw new Error('invalid input color value');
	}

	if (num === 500) {
		return colorObj.toHex();
	}

	const colorIndex = colorNumberMap[num];

	const isLight = num < 500;
	const hsv = colorObj.toHsv();
	const i = isLight ? lightColorCount + 1 - colorIndex : colorIndex - lightColorCount - 1;

	const newHsv: HsvColor = {
		h: getHue(hsv, i, isLight),
		s: getSaturation(hsv, i, isLight),
		v: getValue(hsv, i, isLight)
	};

	return colord(newHsv).toHex();
}

/**
 * Get hue
 *
 * @param hsv - Hsv format color
 * @param i - The relative distance from 6
 * @param isLight - Is light color
 */
function getHue(hsv: HsvColor, i: number, isLight: boolean) {
	let hue: number;

	const hsvH = Math.round(hsv.h);

	if (hsvH >= 60 && hsvH <= 240) {
		hue = isLight ? hsvH - hueStep * i : hsvH + hueStep * i;
	} else {
		hue = isLight ? hsvH + hueStep * i : hsvH - hueStep * i;
	}

	if (hue < 0) {
		hue += 360;
	}

	if (hue >= 360) {
		hue -= 360;
	}

	return hue;
}

/**
 * Get saturation
 *
 * @param hsv - Hsv format color
 * @param i - The relative distance from 6
 * @param isLight - Is light color
 */
function getSaturation(hsv: HsvColor, i: number, isLight: boolean) {
	if (hsv.h === 0 && hsv.s === 0) {
		return hsv.s;
	}

	let saturation: number;

	if (isLight) {
		saturation = hsv.s - saturationStep * i;
	} else if (i === darkColorCount) {
		saturation = hsv.s + saturationStep;
	} else {
		saturation = hsv.s + saturationStep2 * i;
	}

	if (saturation > 100) {
		saturation = 100;
	}

	if (isLight && i === lightColorCount && saturation > 10) {
		saturation = 10;
	}

	if (saturation < 6) {
		saturation = 6;
	}

	return saturation;
}

/**
 * Get value of hsv
 *
 * @param hsv - Hsv format color
 * @param i - The relative distance from 6
 * @param isLight - Is light color
 */
function getValue(hsv: HsvColor, i: number, isLight: boolean) {
	let value: number;

	if (isLight) {
		value = hsv.v + brightnessStep1 * i;
	} else {
		value = hsv.v - brightnessStep2 * i;
	}

	if (value > 100) {
		value = 100;
	}

	return value;
}
