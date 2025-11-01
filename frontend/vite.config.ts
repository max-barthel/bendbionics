import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const isAnalyze = process.env.ANALYZE === 'true';

  const plugins = [react(), tailwindcss()];

  // Add bundle analysis plugins only when explicitly analyzing
  if (isAnalyze) {
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap', // 'treemap', 'sunburst', 'network'
      }) as any,
      analyzer({
        analyzerMode: 'static',
        openAnalyzer: false,
      }) as any
    );
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/api': path.resolve(__dirname, './src/api'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/features': path.resolve(__dirname, './src/features'),
        '@/styles': path.resolve(__dirname, './src/styles'),
        '@/constants': path.resolve(__dirname, './src/constants'),
      },
    },
    optimizeDeps:
      process.env.CI === 'true'
        ? {
            noDiscovery: true,
            include: undefined,
          }
        : {
            include: [
              'three',
              'three-stdlib',
              '@react-three/fiber',
              '@react-three/drei',
              'react',
              'react-dom',
              'react-router-dom',
              'axios',
              '@tauri-apps/api',
            ],
            exclude: ['@vitest/browser', '@vitest/ui', 'vitest'],
            force: true,
          },
    define: {
      global: 'globalThis',
    },
    esbuild: {
      target: 'node14',
    },
    server: {
      proxy: {
        // Proxy all API requests to backend during development
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
        },
        // Proxy auth routes directly
        '/auth': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        // Proxy preset routes directly
        '/presets': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        // Proxy PCC routes directly
        '/pcc': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        // Proxy tendon routes directly
        '/tendons': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
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
      // Disable caching in development to prevent stale code issues
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
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
            const fileName = assetInfo.names?.[0] || 'asset';
            const info = fileName.split('.');
            const ext = info.at(-1);
            if (/\.(css)$/.test(fileName)) {
              return `css/[name]-[hash].${ext}`;
            }
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(fileName)) {
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
