import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/geopoio/',
  plugins: [svelte()],
  build: {
    outDir: 'dist'
  }
})
