import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    css: {
        // Force PostCSS/Tailwind to reprocess when tailwind.config.js changes
        postcss: './postcss.config.js',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom'],
                    flow: ['@xyflow/react'],
                    ui: ['lucide-react'],
                },
            },
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://localhost:3000',
                ws: true,
            },
        },
    },
});
