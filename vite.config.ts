import { sveltekit } from '@sveltejs/kit/vite';
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react({
		tsDecorators: true
	}), sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	// optimizeDeps: {
	// 	entries: ['class-validator', 'class-transformer', '@credo-ts/askar', '@credo-ts/core', '@credo-ts/node', '@credo-ts/openid4vc', '@credo-ts/tenants']
	// }
});
