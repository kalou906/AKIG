import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_PROXY_TARGET = process.env.VITE_API_PROXY || "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
});
