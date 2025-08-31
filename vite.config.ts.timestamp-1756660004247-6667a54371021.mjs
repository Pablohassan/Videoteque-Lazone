// vite.config.ts
import { defineConfig } from "file:///Users/rusmirsadikovic/projetsperso/cine-scan-connect/node_modules/.pnpm/vite@5.4.19_@types+node@22.18.0_lightningcss@1.30.1/node_modules/vite/dist/node/index.js";
import react from "file:///Users/rusmirsadikovic/projetsperso/cine-scan-connect/node_modules/.pnpm/@vitejs+plugin-react-swc@3.11.0_vite@5.4.19_@types+node@22.18.0_lightningcss@1.30.1_/node_modules/@vitejs/plugin-react-swc/index.js";
import tailwindcss from "file:///Users/rusmirsadikovic/projetsperso/cine-scan-connect/node_modules/.pnpm/@tailwindcss+vite@4.1.12_vite@5.4.19_@types+node@22.18.0_lightningcss@1.30.1_/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
import { componentTagger } from "file:///Users/rusmirsadikovic/projetsperso/cine-scan-connect/node_modules/.pnpm/lovable-tagger@1.1.9_vite@5.4.19_@types+node@22.18.0_lightningcss@1.30.1_/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/Users/rusmirsadikovic/projetsperso/cine-scan-connect";
var vite_config_default = defineConfig(({ mode, command }) => ({
  server: {
    host: "::",
    port: 5173,
    // Port standard Vite
    strictPort: false,
    // Permet à Vite de changer de port si occupé
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
        }
      }
    }
  },
  plugins: [
    tailwindcss(),
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "@server": path.resolve(__vite_injected_original_dirname, "./server")
    }
  },
  build: {
    rollupOptions: {
      external: command === "build" && mode === "production" ? [
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
        "joi"
      ] : []
    }
  },
  ssr: {
    noExternal: mode === "development" ? true : []
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcnVzbWlyc2FkaWtvdmljL3Byb2pldHNwZXJzby9jaW5lLXNjYW4tY29ubmVjdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3J1c21pcnNhZGlrb3ZpYy9wcm9qZXRzcGVyc28vY2luZS1zY2FuLWNvbm5lY3Qvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3J1c21pcnNhZGlrb3ZpYy9wcm9qZXRzcGVyc28vY2luZS1zY2FuLWNvbm5lY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tIFwiQHRhaWx3aW5kY3NzL3ZpdGVcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlLCBjb21tYW5kIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiOjpcIixcbiAgICBwb3J0OiA1MTczLCAvLyBQb3J0IHN0YW5kYXJkIFZpdGVcbiAgICBzdHJpY3RQb3J0OiBmYWxzZSwgLy8gUGVybWV0IFx1MDBFMCBWaXRlIGRlIGNoYW5nZXIgZGUgcG9ydCBzaSBvY2N1cFx1MDBFOVxuICAgIHByb3h5OiB7XG4gICAgICAvLyBQcm94eSBsZXMgcmVxdVx1MDBFQXRlcyBBUEkgdmVycyBsZSBzZXJ2ZXVyIEV4cHJlc3NcbiAgICAgIFwiL2FwaVwiOiB7XG4gICAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjMwMDFcIixcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICBjb25maWd1cmU6IChwcm94eSwgb3B0aW9ucykgPT4ge1xuICAgICAgICAgIHByb3h5Lm9uKFwiZXJyb3JcIiwgKGVyciwgcmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUHJveHkgZXJyb3I6XCIsIGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICB0YWlsd2luZGNzcygpLFxuICAgIHJlYWN0KCksXG4gICAgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpLFxuICBdLmZpbHRlcihCb29sZWFuKSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgIFwiQHNlcnZlclwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc2VydmVyXCIpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgZXh0ZXJuYWw6XG4gICAgICAgIGNvbW1hbmQgPT09IFwiYnVpbGRcIiAmJiBtb2RlID09PSBcInByb2R1Y3Rpb25cIlxuICAgICAgICAgID8gW1xuICAgICAgICAgICAgICBcImV4cHJlc3NcIixcbiAgICAgICAgICAgICAgXCJjb3JzXCIsXG4gICAgICAgICAgICAgIFwiaGVsbWV0XCIsXG4gICAgICAgICAgICAgIFwiYmNyeXB0anNcIixcbiAgICAgICAgICAgICAgXCJqc29ud2VidG9rZW5cIixcbiAgICAgICAgICAgICAgXCJAcHJpc21hL2NsaWVudFwiLFxuICAgICAgICAgICAgICBcImRvdGVudlwiLFxuICAgICAgICAgICAgICBcIm5vZGUtZmV0Y2hcIixcbiAgICAgICAgICAgICAgXCJwYXJzZS10b3JyZW50LXRpdGxlXCIsXG4gICAgICAgICAgICAgIFwibXVsdGVyXCIsXG4gICAgICAgICAgICAgIFwiam9pXCIsXG4gICAgICAgICAgICBdXG4gICAgICAgICAgOiBbXSxcbiAgICB9LFxuICB9LFxuICBzc3I6IHtcbiAgICBub0V4dGVybmFsOiBtb2RlID09PSBcImRldmVsb3BtZW50XCIgPyB0cnVlIDogW10sXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlWLFNBQVMsb0JBQW9CO0FBQzlXLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFKaEMsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxNQUFNLFFBQVEsT0FBTztBQUFBLEVBQ2xELFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQTtBQUFBLElBQ04sWUFBWTtBQUFBO0FBQUEsSUFDWixPQUFPO0FBQUE7QUFBQSxNQUVMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLFdBQVcsQ0FBQyxPQUFPLFlBQVk7QUFDN0IsZ0JBQU0sR0FBRyxTQUFTLENBQUMsS0FBSyxLQUFLLFFBQVE7QUFDbkMsb0JBQVEsSUFBSSxnQkFBZ0IsR0FBRztBQUFBLFVBQ2pDLENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxZQUFZO0FBQUEsSUFDWixNQUFNO0FBQUEsSUFDTixTQUFTLGlCQUFpQixnQkFBZ0I7QUFBQSxFQUM1QyxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUNwQyxXQUFXLEtBQUssUUFBUSxrQ0FBVyxVQUFVO0FBQUEsSUFDL0M7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixVQUNFLFlBQVksV0FBVyxTQUFTLGVBQzVCO0FBQUEsUUFDRTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGLElBQ0EsQ0FBQztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBQUEsRUFDQSxLQUFLO0FBQUEsSUFDSCxZQUFZLFNBQVMsZ0JBQWdCLE9BQU8sQ0FBQztBQUFBLEVBQy9DO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
