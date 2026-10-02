import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  // relative base so the build works under a GitHub Pages sub-path
  base: './',
  plugins: [react()],
  // `vite build --mode artifact`: claude.ai 아티팩트용. 폰트 파일 수를 줄인 빌드.
  ...(mode === 'artifact' && {
    resolve: {
      alias: [
        { find: /^\.\/fonts$/, replacement: fileURLToPath(new URL('./src/fonts.artifact.ts', import.meta.url)) },
      ],
    },
    build: { outDir: 'dist-artifact' },
  }),
}))
