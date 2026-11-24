// =============================================================================
// LexPortal Frontend - Konfiguracja Build Systemu (Vite)
// =============================================================================
//
// Ten plik konfiguracyjny zarządza procesem budowania i serwerem deweloperskim
// dla aplikacji frontendowej przy użyciu narzędzia Vite.
//
// Kluczowe Sekcje:
//   - server: Konfiguracja serwera deweloperskiego, w tym proxy dla zapytań API
//             do backendu, co rozwiązuje problemy z CORS podczas developmentu.
//   - plugins: Lista pluginów rozszerzających funkcjonalność Vite:
//       - react(): Podstawowe wsparcie dla React (HMR, etc.).
//       - tailwindcss(): Integracja z Tailwind CSS.
//       - viteCompression(): Automatyczne tworzenie skompresowanych zasobów
//                            (.gz, .br) dla szybszego ładowania strony.
//       - VitePWA(): Konfiguracja Progressive Web App, w tym generowanie
//                    Service Workera i manifestu aplikacji.
//   - build: Opcje budowania produkcyjnego, w tym `manualChunks` do podziału
//            kodu na mniejsze, cache'owalne części (code splitting).
//   - define: Udostępnia zmienne środowiskowe po stronie klienta w bezpieczny
//             sposób.
//
// =============================================================================
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import viteCompression from 'vite-plugin-compression';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: [
        '7c2d452a-c975-4e56-831d-3f8384445b75-00-gonl5wjfjixq.picard.replit.dev',
      ],
      watch: {
        ignored: ['**/backend/**', '**/node_modules/**', '**/.venv/**']
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    worker: {
      format: 'es',
    },
    plugins: [
      react(),
      tailwindcss(),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['lucide-react', 'framer-motion', 'recharts'],
            utils: ['zod']
          }
        }
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
