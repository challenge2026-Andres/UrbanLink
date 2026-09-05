import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `npm run dev:mobile` roda em HTTPS (necessário para GPS e câmera fora do localhost).
  const mobile = mode === 'mobile'

  return {
    plugins: [react(), ...(mobile ? [basicSsl()] : [])],
    server: {
      // Escuta em toda a rede local para acesso pelo celular.
      host: true,
      port: 5173,
      // Encaminha /api para o backend, evitando CORS e mixed content.
      proxy: {
        '/api': {
          target: 'http://localhost:3333',
          changeOrigin: true,
        },
      },
    },
  }
})
