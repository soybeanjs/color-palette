# @soybeanjs/colord

  <strong>Colord</strong> is a tiny yet powerful tool for high-performance color manipulations and conversions. fork from [colord](https://github.com/omgovich/colord)

## Features

- 📦 **Small**: Just **1.7 KB** gzipped ([3x+ lighter](#benchmarks) than **color** and **tinycolor2**)
- 🚀 **Fast**: [3x+ faster](#benchmarks) than **color** and **tinycolor2**
- 😍 **Simple**: Chainable API and familiar patterns
- 💪 **Immutable**: No need to worry about data mutations
- 🛡 **Bulletproof**: Written in strict TypeScript and has 100% test coverage
- 🗂 **Typed**: Ships with [types included](#types)
- 🏗 **Extendable**: Built-in [plugin system](#plugins) to add new functionality
- 📚 **CSS-compliant**: Strictly follows CSS Color Level specifications
- 👫 **Works everywhere**: Supports all browsers and Node.js
- 💨 **Dependency-free**

## Differences from [colord](https://github.com/omgovich/colord)

- support `oklab` and `oklch` color space
- more correct color parsing
- simplify type definitions
- rewrite color string parsing
- rename alpha property `a` to `alpha`

## Getting Started

```bash
pnpm i @soybeanjs/colord
```

```ts
import { colord } from '@soybeanjs/colord';

colord("#ff0000").grayscale().alpha(0.25).toRgbString(); // "rgba(128, 128, 128, 0.25)"
colord("rgb(192, 192, 192)").isLight(); // true
colord("hsl(0, 50%, 50%)").darken(0.25).toHex(); // "#602020"
colord({ r: 128, g: 128, b: 128, alpha: 0.25 }).toRgbString(); // "rgba(128, 128, 128, 0.25)"
```

## Supported Color Models

- Hexadecimal strings (including 3, 4 and 8 digit notations)
- RGB strings and objects
- HSL strings and objects
- HSV objects
- Color names ([via plugin](#plugins))
- HWB objects and strings ([via plugin](#plugins))
- CMYK objects and strings ([via plugin](#plugins))
- LCH objects and strings ([via plugin](#plugins))
- LAB objects ([via plugin](#plugins))
- XYZ objects ([via plugin](#plugins))
- OKLAB objects ([via plugin](#plugins))
- OKLCH objects ([via plugin](#plugins))

## More API

see the more api in [colord](https://github.com/omgovich/colord)
