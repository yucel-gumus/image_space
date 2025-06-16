import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      base: '/',
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: !isProduction,
        minify: isProduction ? 'terser' : false,
        target: 'es2020',
        rollupOptions: {
          output: {
            manualChunks: {
              // React ve React-DOM'u ayrı chunk'a ayır
              'react-vendor': ['react', 'react-dom'],
              // Three.js ve R3F'i ayrı chunk'a ayır
              'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
              // Animation kütüphanelerini ayrı chunk'a ayır
              'animation-vendor': ['framer-motion-3d', 'motion'],
              // State management'ı ayrı chunk'a ayır
              'state-vendor': ['zustand', 'immer', 'auto-zustand-selectors-hook'],
              // Utility kütüphanelerini ayrı chunk'a ayır
              'utils-vendor': ['clsx']
            },
            // Asset dosya isimlendirme
            chunkFileNames: 'assets/js/[name]-[hash].js',
            entryFileNames: 'assets/js/[name]-[hash].js',
            assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
          }
        },
        // Terser optimizasyonları
        terserOptions: isProduction ? {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
          },
          mangle: {
            safari10: true
          }
        } : undefined,
        // Chunk size uyarıları
        chunkSizeWarningLimit: 1000
      },
      // Development server optimizasyonları
      server: {
        hmr: {
          overlay: false
        }
      },
      // CSS optimizasyonları
      css: {
        devSourcemap: !isProduction
      }
    };
});
