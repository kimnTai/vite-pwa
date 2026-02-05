import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { join } from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { getBuildVersion } from "./scripts/tool";

const VERSION = getBuildVersion();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: "vite-pwa",
        short_name: "vite-pwa",
        description: "我是描述我是描述",
        theme_color: "#b68bc9",
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },

      devOptions: {
        enabled: true,
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": join(__dirname, "src"),
    },
  },
  base: "./",
  define: {
    VERSION: `'${VERSION}'`,
  },
});
