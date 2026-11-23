import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    fs: {
      strict: false,
      allow: ['D:/My Project/perfume', 'E:/My Project/perfume', 'D:/', 'E:/']
    }
  }
})
