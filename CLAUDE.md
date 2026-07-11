# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用指令

```bash
bun run dev          # 啟動開發伺服器（Vite）
bun run build        # tsc -b 型別檢查 + vite build
bun run lint         # eslint . --fix
bun run preview      # 預覽 production build
bun run deploy       # build 後以 gh-pages 部署 dist/ 到 GitHub Pages
bun run test         # 執行全部測試（vitest：unit + browser 兩個 project）
bun run test:unit    # 只跑 node 單元測試（快，日常回饋用）
bun run test:browser # 只跑真實瀏覽器整合測試（需已裝 Chromium 且能連 CDN）
```

- 測試用 Vitest，設定見 `vitest.config.ts`（見下方「測試」段）。
- 若終端機出現 `zsh: command not found: yarn`，先執行 `nvm use` 載入 nvm 再重試。

## 架構概觀

這是一個 React 19 + TypeScript + Vite 8 的 PWA，主功能是**純前端圖片文字辨識（OCR）**，
針對某遊戲「核心自选宝箱」畫面做結構化欄位擷取。

- **OCR 主流程**：使用 `tesseract.js`（WebAssembly，完全在瀏覽器執行，語言資料走 CDN）。
  - `src/components/ImageOcr.tsx`：UI 元件，支援上傳/拖放/貼上、預覽、進度條、可編輯結果與一鍵複製。
  - `src/hooks/useOcr.ts`：封裝 Tesseract worker 生命週期；`runBatch` 依序辨識多個區域並回報進度，
    支援 per-task `psm`/`whitelist`/`langs`（以 `worker.reinitialize` 切換語言，不需重新下載模型）。
  - `src/utils/prizeTemplate.ts`：**模板擷取核心**。`PRIZE_REGIONS` 以**相對比例座標**定義各欄位
    （header、A~G、final），容忍等比縮放。分數格為色塊上白字 → 高門檻二值化 + 負片
    （`binarizeWhitePixels`）；header 為一般中文列（`normalizePixels`）。`buildTemplateLines` 組裝結果。
  - 關鍵取捨：分數格用 `eng` 語言（中文模型會在數字間插入雜字），header 用 `chi_sim+eng`；
    header 不設白名單，靠誤判的中文自然分隔兩組數字，再以 regex 重組為固定格式。
  - 這套座標是**針對該固定版面校準**的；若遊戲改版或換不同畫面，需重新校準 `PRIZE_REGIONS`。
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
  Tailwind v4 的 CSS-first 設定（見 `src/assets/index.css`）。專案採 mobile-first RWD（以手機為主）。
  另引入 shadcn 慣用的 `cn`（`src/lib/utils.ts`，`clsx` + `tailwind-merge`）供條件式 className 合併。

## 測試

使用 Vitest，`vitest.config.ts` 以 **projects** 分成兩組：

- **unit**（node 環境）：`test/**/*.test.ts`，測純函式（`prizeTemplate.ts` 的座標、像素轉換、
  `formatHeaderLine`/`buildTemplateLines`）。快速，日常用 `bun run test:unit`。
- **browser**（真實 Chromium，`@vitest/browser` + `@vitest/browser-playwright`）：
  `test/**/*.browser.test.ts`，跑**與正式環境相同的瀏覽器路徑**——真 `Image` + canvas 前處理 +
  瀏覽器版 tesseract.js，對實際截圖 `test/fixtures/test.jpg` 斷言完整結構化輸出。

注意：browser 測試首次需連 CDN 下載語言資料，且需先 `bunx playwright install chromium`（CI 亦然）。
測試檔集中在 `test/`，其型別由 `tsconfig.test.json` 涵蓋。

## 程式碼風格

- 函式不要顯式標註回傳型別，讓 TypeScript 自動推導；只有公開 API、複雜泛型或型別推導不穩定時才標註。
- 所有控制流程必須使用大括號（`if/for/while`），對應 eslint `curly` 規則。
- import 排序由 `eslint-plugin-simple-import-sort` 強制執行，執行 `bun run lint` 會自動修正。
- 格式化交由 Prettier（含 `prettier-plugin-tailwindcss` 排序 class）與 `eslint-plugin-prettier` 處理，
  不要手動對齊或調整這些格式。
- 空行風格依 ESLint `padding-line-between-statements`：連續變數宣告間不空行；宣告區塊後若下一行非宣告則空一行；
  `return` 前空一行（除非是 block 第一行）；`if/for/while/switch/try` 前後與相鄰陳述式間空一行。
- **型別感知 lint**：`eslint.config.ts` 對 `src`/`test` 啟用 `tseslint.configs.recommendedTypeChecked`
  （需 `parserOptions.projectService`）。因此未 await 的 Promise 需以 `void` 明確標記
  （`no-floating-promises`），async 函式不可直接當事件 handler，要包成 `() => void fn()`
  （`no-misused-promises`）。
