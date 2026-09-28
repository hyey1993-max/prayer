import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // relative base so the build works under a GitHub Pages sub-path
  base: './',
  plugins: [react()],
})
