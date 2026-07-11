# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用指令

```bash
bun run dev       # 啟動開發伺服器（Vite）
bun run build     # tsc -b 型別檢查 + vite build
bun run lint      # eslint . --fix
bun run preview   # 預覽 production build
bun run deploy    # build 後以 gh-pages 部署 dist/ 到 GitHub Pages
```

- 沒有測試框架與測試腳本；本專案目前無單元測試。
- 若終端機出現 `zsh: command not found: yarn`，先執行 `nvm use` 載入 nvm 再重試。

## 架構概觀

這是一個 React 19 + TypeScript + Vite 8 的 PWA 範本專案。

- **版本號機制**：`vite.config.ts` 在 build 時呼叫 `scripts/tool.ts` 的 `getBuildVersion()`，
  以 `年(西元後兩碼-24).月.日.時分/6` 的格式產生版本字串，並透過 Vite 的 `define` 注入為全域常數
  `VERSION`（型別宣告見 `src/@types/global.d.ts`）。`VersionBadge` 元件消費這個常數並依版號雜湊出顯示顏色。
  這個版本號格式是特別為了配合舊有後台/RN app 的版本比對規則設計的，修改前需確認相容性影響。
- **PWA / Service Worker**：透過 `vite-plugin-pwa` 設定（`vite.config.ts`），`registerType` 為 `"prompt"`
  （手動觸發更新，而非自動 `autoUpdate`）。`src/components/PWABadge.tsx` 使用
  `virtual:pwa-register/react` 的 `useRegisterSW`，並額外實作了 `registerPeriodicSync`
  週期性檢查更新（目前設為 15 秒，供開發測試；正式環境可依需求調整或移除）。
- **PWA 圖示資源**：`pwa-assets.config.ts` 定義以 `public/favicon.svg` 為來源，透過
  `@vite-pwa/assets-generator` 產生各尺寸圖示。
- **路徑別名**：`@` 對應到 `src/`（見 `vite.config.ts` 與對應的 `tsconfig` paths）。
- **樣式**：使用 Tailwind CSS v4（`@tailwindcss/vite` 外掛），無獨立 tailwind.config，樣式規則走
  Tailwind v4 的 CSS-first 設定（見 `src/assets/index.css`）。

## 程式碼風格

- 函式不要顯式標註回傳型別，讓 TypeScript 自動推導；只有公開 API、複雜泛型或型別推導不穩定時才標註。
- 所有控制流程必須使用大括號（`if/for/while`），對應 eslint `curly` 規則。
- import 排序由 `eslint-plugin-simple-import-sort` 強制執行，執行 `bun run lint` 會自動修正。
- 格式化交由 Prettier（含 `prettier-plugin-tailwindcss` 排序 class）與 `eslint-plugin-prettier` 處理，
  不要手動對齊或調整這些格式。
- 空行風格依 ESLint `padding-line-between-statements`：連續變數宣告間不空行；宣告區塊後若下一行非宣告則空一行；
  `return` 前空一行（除非是 block 第一行）；`if/for/while/switch/try` 前後與相鄰陳述式間空一行。
