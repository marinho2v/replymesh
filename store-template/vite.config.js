import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    strictMode: false
  })],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-build-20260614-hotfix-[hash].js',
        chunkFileNames: 'assets/[name]-build-20260614-hotfix-[hash].js',
        assetFileNames: 'assets/[name]-build-20260614-hotfix-[hash][extname]',
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'framer-motion', 'sonner'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
})
