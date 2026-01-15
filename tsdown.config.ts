import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/colord.ts', 'src/index.ts', 'src/plugins/**/*.ts'],
  platform: 'neutral',
  clean: true,
  dts: true,
  // shims: true,
  sourcemap: false,
  minify: false,
  fixedExtension: false
});
