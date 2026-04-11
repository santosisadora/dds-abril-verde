import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [basicSsl()],

  publicDir: 'public',

  server: {
    host: true,
    port: 5175,
    https: true,   // HTTPS é obrigatório para câmera no Android
    open: false,

    headers: {
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
  },

  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
})
