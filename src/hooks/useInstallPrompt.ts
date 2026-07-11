import { useEffect, useState } from "react";

type Platform = "installed" | "android" | "ios" | "unsupported";

/**
 * 判斷 App 目前是否已經以「已安裝」的獨立視窗模式開啟。
 * standalone 代表使用者已把 PWA 加入主畫面並從主畫面開啟。
 */
function isStandalone() {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean })
    .standalone;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosStandalone === true
  );
}

/**
 * 粗略判斷是否為 iOS / iPadOS 裝置。
 * iPadOS 13+ 的 UA 會偽裝成 Mac，需額外用觸控點數輔助判斷。
 */
function isIos() {
  const ua = navigator.userAgent;
  const iPadOs = ua.includes("Macintosh") && navigator.maxTouchPoints > 1;

  return /iphone|ipad|ipod/i.test(ua) || iPadOs;
}

/**
 * 封裝跨平台的 PWA 安裝提示邏輯。
 * - Android/Chrome：攔截 beforeinstallprompt，交由 UI 自訂時機呼叫 promptInstall。
 * - iOS Safari：無此事件，只能回報 platform 讓 UI 顯示手動加入的引導。
 */
export function useInstallPrompt() {
  // 初始平台以 lazy initializer 同步判斷，避免在 effect 內同步 setState
  const [platform, setPlatform] = useState<Platform>(() => {
    if (isStandalone()) {
      return "installed";
    }
    if (isIos()) {
      return "ios";
    }

    return "unsupported";
  });
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) {
      return;
    }

    function onBeforeInstallPrompt(e: BeforeInstallPromptEvent) {
      // 阻止瀏覽器自動彈出，改由使用者點按鈕時才觸發
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform("android");
    }

    function onAppInstalled() {
      setDeferredPrompt(null);
      setPlatform("installed");
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    // 無論接受或取消，事件都只能使用一次，用完即丟
    setDeferredPrompt(null);
    if (choice.outcome === "accepted") {
      setPlatform("installed");
    }
  }

  return { platform, canInstall: deferredPrompt !== null, promptInstall };
}
