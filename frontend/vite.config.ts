import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const isAnalyze = process.env.ANALYZE === 'true';

  const plugins = [react(), tailwindcss()];

  // Add bundle analysis plugins in production or when analyzing
  if (isProduction || isAnalyze) {
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap', // 'treemap', 'sunburst', 'network'
      }),
      analyzer({
        analyzerMode: 'static',
        openAnalyzer: true,
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json',
        reportFilename: 'bundle-report.html',
      })
    );
  }

  return {
    plugins,
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
          '**/Thumbs.db',
        ],
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: id => {
            // Core React libraries
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }

            // 3D visualization libraries (heaviest)
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor';
            }

            // Form and utilities
            if (id.includes('axios')) {
              return 'form-vendor';
            }

            // Tauri API
            if (id.includes('@tauri-apps')) {
              return 'tauri-vendor';
            }

            // Tailwind and styling
            if (
              id.includes('tailwind') ||
              id.includes('postcss') ||
              id.includes('autoprefixer')
            ) {
              return 'style-vendor';
            }

            // Router
            if (id.includes('react-router')) {
              return 'router-vendor';
            }

            // Testing libraries (dev only, won't affect production build)
            if (
              id.includes('vitest') ||
              id.includes('jsdom') ||
              id.includes('testing-library')
            ) {
              return 'test-vendor';
            }
          },
          // Optimize chunk naming for better caching
          chunkFileNames: () => {
            return `js/[name]-[hash].js`;
          },
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: assetInfo => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            if (/\.(css)$/.test(assetInfo.name || '')) {
              return `css/[name]-[hash].${ext}`;
            }
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name || '')) {
              return `images/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          },
        },
      },
      // Performance optimizations
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
        },
      },
      // Increase warning limit for technical applications with 3D libraries
      chunkSizeWarningLimit: 1000,
      // Enable source maps for debugging in development
      sourcemap: !isProduction,
      // Target modern browsers for better performance
      target: 'esnext',
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Report compressed sizes
      reportCompressedSize: true,
    },
  };
});
