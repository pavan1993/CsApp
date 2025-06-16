import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@services': resolve(__dirname, 'src/services'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@context': resolve(__dirname, 'src/context'),
    },
  },
  
  // Development server configuration
  server: {
    port: 3000,
    host: true, // Allow external connections
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'esbuild' : false,
    
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          utils: ['axios'],
        },
      },
      external: [],
    },
    
    // Asset optimization
    assetsInlineLimit: 4096, // 4kb
    chunkSizeWarningLimit: 1000, // 1MB
    
    // Target modern browsers in production
    target: mode === 'production' ? 'es2020' : 'esnext',
    
    // Skip type checking during build for faster builds
    emptyOutDir: true,
  },
  
  // Disable strict TypeScript checking for build
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  
  // Environment variables
  envPrefix: 'VITE_',
  
  // CSS configuration
  css: {
    devSourcemap: mode === 'development',
  },
  
  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'recharts',
      'lucide-react',
    ],
  },
  
  // Preview server (for production builds)
  preview: {
    port: 4173,
    host: true,
  },
  
  // Test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
    },
  },
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://localhost:5000/api'
    ),
  },
}))
