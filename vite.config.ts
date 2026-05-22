import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: process.env.DEPLOY_TARGET === 'pages' ? '/cardtan/' : '/',
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
