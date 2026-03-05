
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, path.resolve(), '');

  // Safety check for API Key
  const apiKey = env.API_KEY || "YOUR_GEMINI_API_KEY_HERE";
  const openAiKey = env.OPENAI_API_KEY || "YOUR_OPENAI_API_KEY_HERE";
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        // Explicitly map @ to the utils directory
        '@': path.resolve(__dirname, 'utils'),
        // Map lib to the lib directory at root
        'lib': path.resolve(__dirname, 'lib'),
      },
    },
    server: {
      host: '0.0.0.0', // Essential for Cloud Run
      port: 3000,
      strictPort: true, // Fail if port is busy
      proxy: {
        '/whatsapp-api': {
          target: 'https://graph.facebook.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/whatsapp-api/, '')
        }
      }
    },
    preview: {
      host: '0.0.0.0', // Essential for Cloud Run preview mode
      port: 3000,
      strictPort: true,
      allowedHosts: ['.run.app', 'localhost'], // Allow Cloud Run domains
    },
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.OPENAI_API_KEY': JSON.stringify(openAiKey),
      'process.env.HUGGINGFACE_API_KEY': JSON.stringify(env.HUGGINGFACE_API_KEY || ""),
    },
    build: {
        target: 'esnext',
        sourcemap: false,
        minify: 'esbuild',
    }
  };
});
