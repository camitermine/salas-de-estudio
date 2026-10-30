import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // El front llama a /api/...; Vite lo reenvía al backend sin el prefijo.
    // Así no hace falta configurar CORS ni escribir la URL del backend en el código.
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        rewrite: (ruta) => ruta.replace(/^\/api/, ''),
      },
    },
  },
})
