import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { getBuildVersion } from "./scripts/tool";

const VERSION = getBuildVersion();

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
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webp}"],
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
    tsconfigPaths: true,
  },
  base: "./",
  server: {
    port: 6173,
  },
  preview: {
    port: 6173,
  },
  define: {
    VERSION: `'${VERSION}'`,
  },
});
