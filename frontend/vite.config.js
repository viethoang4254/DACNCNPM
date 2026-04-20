import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Keep production bundle aggressively optimized for Performance/SEO audits.
    minify: "esbuild",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      treeshake: true,
      output: {
        // Split vendors by runtime usage so lazy-route deps are not forced into initial chunk.
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router/') ||
            id.includes('/react-router-dom/')
          ) {
            return 'vendor-react-core'
          }

          if (id.includes('/react-toastify/')) {
            return 'vendor-toastify'
          }

          if (id.includes('/axios/')) {
            return 'vendor-axios'
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

          // Let Rollup decide for the rest to maximize async-chunk efficiency.
          return undefined
        },
      },
    },
  },
})
