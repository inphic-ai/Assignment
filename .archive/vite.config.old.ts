import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
      },
      preview: {
        port: 4173,
        host: '0.0.0.0',
        allowedHosts: true,
      },
      plugins: [react()],
      define: {
        // 只定義公開的環境變數，不包含 API Key
        'process.env.VITE_API_BASE': JSON.stringify(env.VITE_API_BASE || 'http://localhost:3000/api'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // 將 React 相關套件分離
              'vendor-react': ['react', 'react-dom'],
              // 將圖表庫分離（較大的依賴）
              'vendor-recharts': ['recharts'],
              // 將圖標庫分離
              'vendor-icons': ['lucide-react'],
            }
          }
        }
      }
    };
});
