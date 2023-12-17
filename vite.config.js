import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: [ 'kissfft-wasm' ]
  },
  worker: {
    format: "es"
  },
  build: {
    target: 'esnext',
    minify: false,
  },
  base: "/vite/"
})
