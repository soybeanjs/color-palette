import { parseHex } from '../models/hex';
import { parseRgb, parseRgbString } from '../models/rgb';
import { parseHsl, parseHslString } from '../models/hsl';
import { parseHsv } from '../models/hsv';
import { parseOklch, parseOklchString } from '../models/oklch';
import type { Format, Input, InputObject, ParseResult, Parser, Parsers } from '../types';

// The built-in input parsing functions.
// We use array instead of object to keep the bundle size lighter.
export const parsers: Parsers = {
  string: [
    [parseHex, 'hex'],
    [parseRgbString, 'rgb'],
    [parseHslString, 'hsl'],
    [parseOklchString, 'oklch']
  ],
  object: [
    [parseRgb, 'rgb'],
    [parseHsl, 'hsl'],
    [parseHsv, 'hsv'],
    [parseOklch, 'oklch']
  ]
};

const findValidColor = <I extends Input>(input: I, $parsers: Parser<I>[]): ParseResult | [null, undefined] => {
  for (let i = 0; i < $parsers.length; i += 1) {
    const result = $parsers[i][0](input);
    if (result) {
      return [result, $parsers[i][1]];
    }
  }

  return [null, undefined];
};

/** Tries to convert an incoming value into RGBA color by going through all color model parsers */
export const parse = (input: Input): ParseResult | [null, undefined] => {
  if (typeof input === 'string') {
    return findValidColor<string>(input.trim(), parsers.string);
  }

  // Don't forget that the type of `null` is "object" in JavaScript
  // https://bitsofco.de/javascript-typeof/
  if (typeof input === 'object' && input !== null) {
    return findValidColor<InputObject>(input, parsers.object);
  }

  return [null, undefined];
};

/**
 * Returns a color model name for the input passed to the function.
 */
export const getFormat = (input: Input): Format | undefined => parse(input)[1];
