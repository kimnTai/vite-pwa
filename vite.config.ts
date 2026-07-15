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
        name: "核心速記",
        short_name: "核心速記",
        description: "核心自选宝箱畫面 OCR 辨識，快速擷取結構化欄位",
        theme_color: "#b68bc9",
        // Android 以 standalone 開啟時，會用 background_color + 圖示自動組出啟動畫面
        background_color: "#191320",
        display: "standalone",
        orientation: "portrait", // 安裝為 PWA 後，偏好以直向顯示；實際支援依瀏覽器與系統而定
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
