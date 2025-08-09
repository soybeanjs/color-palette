import { colord } from 'colord';
import { colorNames } from '../constant/name';

/**
 * Get color name
 *
 * @param color
 */
export function getColorName(color: string) {
	const colorObj = colord(color);

	const hex = colorObj.toHex();
	const rgb = colorObj.toRgb();
	const hsl = colorObj.toHsl();

	let ndf = 0;
	let ndf1 = 0;
	let ndf2 = 0;
	let cl = -1;
	let df = -1;

	let name = '';

	colorNames.some((item, index) => {
		const [hexValue, colorName] = item;

		const match = hex === hexValue;

		if (match) {
			name = colorName;
		} else {
			const { r, g, b } = colord(hexValue).toRgb();
			const { h, s, l } = colord(hexValue).toHsl();

			ndf1 = (rgb.r - r) ** 2 + (rgb.g - g) ** 2 + (rgb.b - b) ** 2;
			ndf2 = (hsl.h - h) ** 2 + (hsl.s - s) ** 2 + (hsl.l - l) ** 2;

			ndf = ndf1 + ndf2 * 2;
			if (df < 0 || df > ndf) {
				df = ndf;
				cl = index;
			}
		}

		return match;
	});

	name = colorNames[cl][1];

	return name;
}
