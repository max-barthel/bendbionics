import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],

          // 3D visualization libraries (heaviest)
          'three-vendor': ['@react-three/fiber', '@react-three/drei', 'three', 'three-stdlib'],

          // Form and utilities
          'form-vendor': ['axios']
        }
      }
    },
    // Increase warning limit for technical applications
    chunkSizeWarningLimit: 800
  }
})
