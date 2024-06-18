import { sveltekit } from '@sveltejs/kit/vite';
import ts from 'typescript';
import { vitePluginTypescriptTransform } from 'vite-plugin-typescript-transform';
import { defineConfig } from 'vitest/config';


export default defineConfig({
	plugins: [sveltekit(), vitePluginTypescriptTransform({
		enforce: 'pre',
		filter: {
			files: {
				include: /\.ts$/,
			},
		},
		tsconfig: {
			override: {
				target: ts.ScriptTarget.ES2021,
			},
		},
	})],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});


