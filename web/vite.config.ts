import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Toutes les interfaces, comme --host : par défaut, Vite n'écoute que sur
    // localhost, et le port n'est pas joignable hors du conteneur
    host: true,
    // Les appels /api partent vers l'API : le service « api » sous Docker
    // (API_URL), sinon la même machine
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:3000' },
  },
});
