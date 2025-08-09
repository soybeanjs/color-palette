import { colord, extend } from 'colord';
import labPlugin from 'colord/plugins/lab';
import { getColorName } from '../shared';
import { tailwindColorPalette } from '../constant/palette';
import type {
	ColorPalette,
	ColorPaletteFamily,
	ColorPaletteFamilyWithNearestPalette,
	ColorPaletteNumber,
	MatchedColorPaletteFamily
} from '../types';

extend([labPlugin]);

export function generateNearestPalette(color: string) {
	const colorObj = colord(color);

	if (!colorObj.isValid()) {
		throw new Error('invalid input color value');
	}

	let colorName = getColorName(color);

	colorName = colorName.toLowerCase().replace(/\s/g, '-');

	const { h: h1, s: s1 } = colorObj.toHsl();

	const families = getColorFamiliesByTailwindPalette();

	const { palette, lightness } = getNearestColorPaletteFamily(color, families);

	const { h: h2, s: s2 } = colord(lightness.hex).toHsl();

	const deltaH = h1 - h2;

	const sRatio = s1 / s2;

	const colorPaletteFamily: MatchedColorPaletteFamily = {
		name: colorName,
		number: lightness.number,
		hex: lightness.hex,
		palette: Object.entries(palette).reduce((acc, current) => {
			const [num, hex] = current;

			const number = Number(num) as ColorPaletteNumber;

			if (number === lightness.number) {
				acc[number] = hex;
			} else {
				const { h: h3, s: s3, l } = colord(hex).toHsl();

				const newH = deltaH < 0 ? h3 + deltaH : h3 - deltaH;
				const newS = s3 * sRatio;

				const newHex = colord({ h: newH, s: newS, l }).toHex();

				acc[number] = newHex;
			}

			return acc;
		}, {} as ColorPalette)
	};

	return colorPaletteFamily;
}

/**
 * get nearest color palette family
 *
 * @param color color
 * @param families color palette families
 */
function getNearestColorPaletteFamily(color: string, families: ColorPaletteFamily[]) {
	const familiesWithConfig = families.map(family => {
		const palettes = Object.entries(family.palette).map(([number, hex]) => {
			return {
				number: Number(number) as ColorPaletteNumber,
				hex,
				delta: colord(color).delta(hex)
			};
		});

		const matched = palettes.reduce((prev, curr) => (prev.delta < curr.delta ? prev : curr));

		return {
			...family,
			palettes,
			matched
		};
	});

	const nearestPaletteFamily = familiesWithConfig.reduce((prev, curr) =>
		prev.matched.delta < curr.matched.delta ? prev : curr
	);

	const { l } = colord(color).toHsl();

	const paletteFamily: ColorPaletteFamilyWithNearestPalette = {
		...nearestPaletteFamily,
		lightness: nearestPaletteFamily.palettes.reduce((prev, curr) => {
			const { l: prevLightness } = colord(prev.hex).toHsl();
			const { l: currLightness } = colord(curr.hex).toHsl();

			const deltaPrev = Math.abs(prevLightness - l);
			const deltaCurr = Math.abs(currLightness - l);

			return deltaPrev < deltaCurr ? prev : curr;
		})
	};

	return paletteFamily;
}

function getColorFamiliesByTailwindPalette() {
	const families: ColorPaletteFamily[] = [];

	Object.entries(tailwindColorPalette).forEach(([key, palette]) => {
		const family: ColorPaletteFamily = {
			name: key,
			palette
		};

		families.push(family);
	});

	return families;
}
