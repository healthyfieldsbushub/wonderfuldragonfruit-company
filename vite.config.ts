import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: { overlay: false },
    proxy: {
      // The backend (server/index.ts) listens on 3001; Vite itself is on 3000.
      "/api": { target: "http://127.0.0.1:3001", changeOrigin: true },
      "/manus-storage": { target: "http://127.0.0.1:3001", changeOrigin: true },
    },
  },
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Heavy, rarely-critical libraries loaded async
            if (id.includes("jspdf") || id.includes("html2canvas")) return "pdf-export";
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("recharts")) return "charts";
            if (id.includes("react-quill") || id.includes("quill")) return "rich-editor";
            if (id.includes("date-fns")) return "date-fns";
            // Everything else (React, router, query, Radix UI, next-themes,
            // etc.) must stay in ONE chunk — splitting React-ecosystem
            // packages across chunks creates circular imports and breaks
            // namespace bindings like next-themes' React.createContext.
            return "vendor-core";
          }
        },
      },
    },
  },
}));
