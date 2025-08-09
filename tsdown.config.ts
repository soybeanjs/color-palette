import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	platform: 'node',
	clean: true,
	dts: true,
	sourcemap: false,
	minify: true,
	format: ['esm'],
	target: 'node18',
	external: ['colord']
});
