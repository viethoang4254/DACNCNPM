import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('react-icons')) {
            return 'vendor-react-icons'
          }

          if (id.includes('recharts')) {
            return 'vendor-recharts'
          }

          if (id.includes('slick-carousel') || id.includes('react-slick')) {
            return 'vendor-slick'
          }

          return 'vendor-misc'
        },
      },
    },
  },
})
