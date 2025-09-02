import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        watch: {
            ignored: [
                '**/src-tauri/target/**',
                '**/src-tauri/Cargo.lock',
                '**/node_modules/**',
                '**/.git/**',
                '**/*.log',
                '**/*.tmp',
                '**/*.temp',
                '**/.DS_Store',
                '**/Thumbs.db'
            ]
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Core React libraries
                    if (id.includes('react') || id.includes('react-dom')) {
                        return 'react-vendor'
                    }

                    // 3D visualization libraries (heaviest)
                    if (id.includes('three') || id.includes('@react-three')) {
                        return 'three-vendor'
                    }

                    // Form and utilities
                    if (id.includes('axios')) {
                        return 'form-vendor'
                    }

                    // Tauri API
                    if (id.includes('@tauri-apps')) {
                        return 'tauri-vendor'
                    }

                    // Tailwind and styling
                    if (id.includes('tailwind') || id.includes('postcss') || id.includes('autoprefixer')) {
                        return 'style-vendor'
                    }

                    // Router
                    if (id.includes('react-router')) {
                        return 'router-vendor'
                    }

                    // Testing libraries (dev only, won't affect production build)
                    if (id.includes('vitest') || id.includes('jsdom') || id.includes('testing-library')) {
                        return 'test-vendor'
                    }
                }
            }
        },
        // Increase warning limit for technical applications with 3D libraries
        chunkSizeWarningLimit: 1000,
        // Enable source maps for debugging (optional)
        sourcemap: false
    }
})
