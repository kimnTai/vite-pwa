# vite-pwa — 前端圖片文字辨識（OCR）

https://kimntai.github.io/vite-pwa/

React 19 + TypeScript + Vite 8 的 PWA。使用者上傳圖片後，**完全在前端**（不經任何後端／雲端 API）
用 [Tesseract.js](https://github.com/naptha/tesseract.js)（WebAssembly）辨識圖片中的文字。

主要功能是針對某遊戲「核心自选宝箱」畫面做**結構化欄位擷取**：依固定版面逐格裁切、二值化，
精準讀出箱數、剩余奖励與 A~G、最终各獎項的分數，輸出成可編輯、可一鍵複製的文字。

## 特色

- 純前端 OCR，離線友善（PWA），不上傳圖片。
- 上傳 / 拖放 / 貼上三種輸入；辨識進度條；結果可即時編輯修正；進頁面即背景預載引擎。
- 針對固定遊戲版面的模板擷取：相對比例座標，容忍等比縮放的不同解析度。
- UI 以 [shadcn](https://ui.shadcn.com/)（`radix-nova` 樣式）建構，支援 light / dark / system 主題切換（按 `d` 快速切換）。
- Mobile-first RWD（以手機為主），含主題感知的靜態背景圖。

## 安裝到主畫面

- **Android / Chrome**：瀏覽器備妥安裝事件後，介面會出現「安裝到主畫面」按鈕，一鍵安裝（standalone 全螢幕、走 Service Worker 離線快取）。
- **iOS Safari**：沒有安裝事件，提供兩種方式，差異如下：

| | ① 手動「加入主畫面」 | ② 描述檔一鍵安裝（`.mobileconfig`） |
|---|---|---|
| 操作 | Safari 分享鈕 →「加入主畫面」 | 點介面連結 → 安裝描述檔（設定 → 一般 → VPN與裝置管理 → 安裝） |
| 觸發瀏覽器 | 僅限 Safari | 僅限 Safari（Chrome iOS 點連結不會跳安裝） |
| 離線快取 | ✅ 吃 Service Worker 預快取，離線可用 | ⚠️ 獨立網頁殼，**不吃** SW 快取，離線能力弱 |
| 內容更新 | 自動跟隨網站 | 改 URL/圖示需重發描述檔重裝 |
| 適用情境 | 一般使用者（**主線**） | 企業內部／掃碼快速派發（輔助） |

> 兩者是**不同的兩個主畫面圖示**。推薦一般使用者走 ①（離線能力完整）；② 的描述檔位於 [`public/webclip.mobileconfig`](./public/webclip.mobileconfig)，部署後在 `/vite-pwa/webclip.mobileconfig`。
>
> iOS 全螢幕與啟動圖不看 manifest，靠 `index.html` 的 `apple-mobile-web-app-*` meta 與 `apple-touch-startup-image` 控制；細節見 [`CLAUDE.md`](./CLAUDE.md)。

## 常用指令

```bash
bun run dev          # 開發伺服器
bun run build        # 型別檢查 + 打包
bun run lint         # ESLint（含型別感知規則）
bun run test         # 全部測試（vitest：unit + browser）
bun run test:unit    # 只跑 node 單元測試
bun run test:browser # 只跑真實瀏覽器整合測試
bun run deploy       # 部署 dist/ 到 GitHub Pages
```

> 執行 `test:browser` 前需先安裝瀏覽器：`bunx playwright install chromium`，且首次辨識需連網下載語言資料。

## 專案結構（重點）

| 路徑 | 說明 |
|---|---|
| `src/components/ImageOcr.tsx` | OCR 主 UI（上傳/拖放/貼上、預覽、進度、結果、複製） |
| `src/hooks/useOcr.ts` | 封裝 Tesseract worker，`runBatch` 逐區域辨識並回報進度 |
| `src/utils/prizeTemplate.ts` | 模板擷取核心：欄位相對座標、二值化、結果組裝 |
| `src/components/ui/` | shadcn 元件（`bunx shadcn@latest add <name>` 產生，設定見 `components.json`） |
| `src/components/theme-provider.tsx` | 主題切換（light / dark / system，localStorage 記憶、按 `d` 切換） |
| `src/lib/utils.ts` | `cn`（shadcn 風格 className 合併） |
| `test/` | Vitest 測試（unit + 真實瀏覽器整合，含 `fixtures/test.jpg`） |

更多架構與程式碼風格說明見 [`CLAUDE.md`](./CLAUDE.md)。

## 技術

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · shadcn（radix-nova）· vite-plugin-pwa · Tesseract.js · Vitest（+ @vitest/browser）
