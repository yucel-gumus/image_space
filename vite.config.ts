import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';
  const gatewayTarget = (env.AI_API_URL || env.GEMINI_GATEWAY_URL || 'https://python-backend-270384591051.europe-west3.run.app').replace(
    /\/$/,
    ''
  );

  return {
    base: '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
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
            'react-vendor': ['react', 'react-dom'],
            'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
            'animation-vendor': ['framer-motion-3d', 'motion'],
            'state-vendor': ['zustand', 'immer', 'auto-zustand-selectors-hook'],
            'utils-vendor': ['clsx'],
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
            },
            mangle: {
              safari10: true,
            },
          }
        : undefined,
      chunkSizeWarningLimit: 1000,
    },
    server: {
      hmr: {
        overlay: false,
      },
      proxy: {
        '/api/generate': {
          target: gatewayTarget,
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const key = env.GATEWAY_CLIENT_API_KEY || env.CLIENT_API_KEY;
              if (key) {
                proxyReq.setHeader('X-API-Key', key);
              }
            });
          },
        },
      },
    },
    css: {
      devSourcemap: !isProduction,
    },
  };
});