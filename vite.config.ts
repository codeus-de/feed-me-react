import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "/feed-me-react/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // PWA-spezifische Konfiguration
  build: {
    // Service Worker und Manifest sollen im Root verfügbar sein
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        sw: path.resolve(__dirname, 'public/sw.js')
      }
    }
  },
  // Stelle sicher, dass Service Worker und Manifest richtig ausgeliefert werden
  publicDir: 'public'
});
