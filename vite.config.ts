import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  server: {
    host: "::",
    port: 5173, // Port standard Vite
    strictPort: false, // Permet à Vite de changer de port si occupé
    proxy: {
      // Proxy les requêtes API vers le serveur Express
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            console.log("Proxy error:", err);
          });
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@server": path.resolve(__dirname, "./server"),
    },
  },
  build: {
    rollupOptions: {
      external:
        command === "build" && mode === "production"
          ? [
              "express",
              "cors",
              "helmet",
              "bcryptjs",
              "jsonwebtoken",
              "@prisma/client",
              "dotenv",
              "node-fetch",
              "parse-torrent-title",
              "multer",
              "joi",
            ]
          : [],
    },
  },
  ssr: {
    noExternal: mode === "development" ? true : [],
  },
}));
