# PWA 更新機制與 Service Worker 快取

本文記錄本專案（GitHub Pages 純前端 PWA）的離線快取與「新版本偵測」流程，說明
DevTools 看到的「由 service worker 提供」代表什麼，以及 workbox 如何判斷是否有新版本。

相關程式碼：

- `vite.config.ts` — `VitePWA` / `workbox` 設定
- `src/components/PWABadge.tsx` — 更新提示 UI 與週期性檢查 `registerPeriodicSync`

## 「由 service worker 提供」是什麼意思

DevTools → Network 對 `index.html` 顯示 `200 OK (由「service worker」提供)`（英文為
*from service worker*），代表這筆回應是 **Service Worker 從 Cache Storage 直接回傳的**，
並沒有真的連到 GitHub Pages 主機。

```
瀏覽器發出 GET index.html
        ↓
Service Worker 攔截（fetch 事件）
        ↓
從 Cache Storage 命中 → 直接回傳 200
        ↓
（網路 / 主機完全沒被碰到）
```

補充：

- 本專案是**純前端**、部署在 GitHub Pages 的靜態站，OCR 完全在瀏覽器執行
  （tesseract.js WASM），**沒有 API 後端**。所謂「主機」只提供靜態檔案，
  因此「沒請求到後端」是常態與預期行為。
- 這正是離線可用的原因：`vite-plugin-pwa` 的 workbox 會把
  `**/*.{js,css,html,svg,png,ico,webp}`（見 `vite.config.ts` 的 `globPatterns`）
  預快取起來，命中快取時由 SW 直接回應，斷網也能開。
- 判斷「真的沒碰網路」：由 SW 回應的請求 Size 欄通常顯示 `(ServiceWorker)` 而非實際
  位元組；若 SW 內部又去 fetch 網路，會多出一筆「Initiator 是 service worker」的請求。

## workbox 如何判斷「有沒有新版本」

判斷的最終依據只有一個：**目前執行中的 `sw.js` 與伺服器上的 `sw.js`，位元組是否一致。**

### 為什麼比對 sw.js 就夠

build 時 vite-plugin-pwa 會把**預快取清單（precache manifest）**寫進 `sw.js`：

```js
precacheAndRoute([
  { url: "index.html", revision: "a1b2c3..." }, // 無 hash 檔名 → 靠內容雜湊 revision
  { url: "assets/index-XXXX.js", revision: null }, // 檔名已含 hash → revision 為 null
  ...
]);
```

- 有 hash 的檔案（JS/CSS）：內容一變，檔名的 hash 就變 → `url` 變。
- 無 hash 的檔案（`index.html`、`favicon.svg`…）：靠 `revision` 內容雜湊值。

因此**任何一個被預快取的檔案內容變動，都會讓 `sw.js` 本身的位元組改變**。判斷新版本
於是收斂為「比對 `sw.js` 是否有差異」這一件事。

### 瀏覽器何時會比對 sw.js

1. **開頁 / 導航時**，瀏覽器原生會重新抓 `sw.js` 做 byte-diff。
2. **程式碼主動呼叫 `registration.update()`** — 即 `PWABadge.tsx` 的
   `registerPeriodicSync`（見下節）。
3. 使用者按「重新載入」時，`updateServiceWorker(true)` 內部也會走更新流程。

### 偵測到差異後的流程（本專案為 prompt 模式）

`vite.config.ts` 設 `registerType: "prompt"`（手動更新，非 `autoUpdate`），流程為：

```
sw.js 有差異
   ↓
新 SW 進入 installing
   ↓
安裝完成後停在 waiting（prompt 模式不會自動接管）
   ↓
vite-plugin-pwa 將 needRefresh 設為 true
   ↓
PWABadge 跳出「已有新版本內容，重新載入即可更新。」卡片
   ↓
使用者按「重新載入」→ updateServiceWorker(true) → skipWaiting → controllerchange → reload
```

> iOS 主畫面 Web Clip（standalone）常不觸發 `controllerchange`，因此 `PWABadge.reload()`
> 加了保底：若 2 秒內未因 `controllerchange` 重載，就強制 `window.location.reload()`。

## 週期性檢查 registerPeriodicSync

`PWABadge.tsx` 在 SW 啟用後啟動一個定時器，主動觸發更新比對：

```js
setInterval(async () => {
  if ("onLine" in navigator && !navigator.onLine) {
    return; // 離線時跳過
  }

  const resp = await fetch(swUrl, {
    cache: "no-store", // 強制不吃快取，確實抓伺服器上的 sw.js
    headers: { cache: "no-store", "cache-control": "no-cache" },
  });

  if (resp?.status === 200) {
    await r.update(); // 觸發瀏覽器對 sw.js 做 byte-diff
  }
}, period);
```

常見誤解澄清：

- `resp.status === 200` **不代表有新版**，只確認「檔案抓得到」。真正判斷新舊的是後續
  `r.update()` 交給瀏覽器做的 byte-diff；`sw.js` 沒變就不會跳提示。

## 重要取捨與注意事項

- **快取的 200 不保證是最新版**：prompt 模式下，即使伺服器已有新版，使用者端仍先拿到
  快取的舊 `index.html`，直到更新流程被觸發且使用者按下「重新載入」。這是設計取捨，非 bug。
- **`period` 目前值**：`PWABadge.tsx` 的 `period = 15_000`（15 秒）**實際為啟用狀態**
  （`period <= 0` 關卡未觸發）。每個開著的分頁每 15 秒會打一次 `sw.js`，對正式環境偏激進；
  正式環境可考慮調長（例如 1 小時 = `3_600_000`）或設 `period = 0` 停用。
- `workbox.cleanupOutdatedCaches: true` 會在新 SW 啟用時清掉舊版預快取。
- `workbox.clientsClaim: true` 讓 SW 啟用後立即接管既有分頁。

## WebView / 原生殼環境的差異（Flutter、React Native）

若日後把本站包進原生 App 的 WebView（Flutter `webview_flutter`、
`react-native-webview`），**上述以 Service Worker 為核心的邏輯不能假設一致**，
關鍵在該 WebView 是否支援 Service Worker，而 iOS 與 Android 結論相反。

### iOS：整套 SW 邏輯基本上不成立 ⚠️

iOS 上 `webview_flutter` 與 `react-native-webview` 底層都是 **WKWebView**，而
**WKWebView 不支援 Service Worker**。

- Service Worker 在 iOS 僅於 Safari、`SFSafariViewController`、以及加到主畫面的
  standalone PWA 可用；一般 App 內嵌的 WKWebView 中 `navigator.serviceWorker`
  通常為 `undefined`。
- 因此「由 service worker 提供」的回應、Cache Storage 預快取、`sw.js` byte-diff
  偵測新版、`needRefresh` 提示卡片——**在 iOS WebView 全都不會運作**。

### Android：大致適用，但有 caveat

Android 兩者底層都是 **Android System WebView（Chromium）**，**支援 Service Worker**，
故 `sw.js` byte-diff、Cache Storage、更新流程原則上照舊。但：

- SW 更新的觸發依賴「導航 / 開頁」，而 WebView 常長駐、不重新導航；此時
  `registerPeriodicSync`（主動 `r.update()`）反而更重要，因為它不依賴重新開頁。
- 部分 Android WebView 對 SW 邊角行為（背景更新、`controllerchange` 時機）不如完整
  Chrome 穩定，與 iOS Web Clip 的 `controllerchange` 問題類似。

### 更根本：更新變成「雙層」

包進原生 App 後有兩套更新來源，SW 通常不再是主要那層：

| 層級 | 誰負責 | SW 機制是否適用 |
|------|--------|-----------------|
| 原生殼（App 本體） | App Store / Play Store 發版 | 無關 |
| Web 內容 | 視載入方式而定（見下） | 僅部分情況 |

Web 內容的載入方式決定一切：

- **載入遠端 URL**（指向 GitHub Pages）：Android 上 SW 邏輯照舊；iOS 靠 WKWebView 自己的
  HTTP 快取，沒有 SW。
- **打包成本地 asset**（bundle 進 App）：無網路請求，更新完全靠原生 App 改版，SW 幾乎沒意義。

### 實務建議

- 在 WebView 中先偵測 `navigator.serviceWorker` 是否存在；不存在（iOS）就退回其他更新策略。
- 或將「檢查新版」責任上移到原生層（比對後端版本號 → 提示更新 / 重新載入 WebView）。
