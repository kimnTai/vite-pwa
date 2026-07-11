import {
  combinePresetAndAppleSplashScreens,
  defineConfig,
  minimal2023Preset as preset,
} from "@vite-pwa/assets-generator/config";

// 深色啟動底色，配合紫色主題（與 manifest 的 background_color 一致）
const SPLASH_BACKGROUND = "#191320";

export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  // 在既有圖示 preset 之上疊加 iOS 各機型啟動圖（apple-touch-startup-image）
  preset: combinePresetAndAppleSplashScreens(preset, {
    padding: 0.3,
    // light / dark 都用深色底，讓啟動畫面不受系統主題影響皆為深色
    resizeOptions: { background: SPLASH_BACKGROUND, fit: "contain" },
    darkResizeOptions: { background: SPLASH_BACKGROUND, fit: "contain" },
    linkMediaOptions: { log: true, addMediaScreen: true, xhtml: false },
  }),
  images: ["public/favicon.svg"],
});
