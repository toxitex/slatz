import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const apiTarget = process.env.API_URL || "http://localhost:5000";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port: 3000,
    strictPort: false,
    host: true,
    // The Express API writes SQLite and uploads here; watching them makes Vite full-reload on every write.
    watch: { ignored: ["**/data/**", "**/public/uploads/**", "**/dist/**"] },
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
      "/uploads": { target: apiTarget, changeOrigin: true },
    },
  },
});
