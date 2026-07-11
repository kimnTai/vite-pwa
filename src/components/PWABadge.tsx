import { useRegisterSW } from "virtual:pwa-register/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PWABadge() {
  // 目前已停用週期性同步，如需啟用請調整此數值（單位為毫秒）
  // 若不需要週期性同步，可移除 onRegisteredSW callback 與 registerPeriodicSync 函式
  const period = 15_000;

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) {
        return;
      }
      if (r?.active?.state === "activated") {
        registerPeriodicSync(period, swUrl, r);
      } else if (r?.installing) {
        r.installing.addEventListener("statechange", (e) => {
          const sw = e.target as ServiceWorker;
          if (sw.state === "activated") {
            registerPeriodicSync(period, swUrl, r);
          }
        });
      }
    },
  });

  function close() {
    setNeedRefresh(false);
  }

  // iOS 主畫面 Web Clip（standalone）常不觸發 controllerchange，導致 vite-plugin-pwa
  // 等不到事件而不會 reload。這裡加保底：若短時間內沒因 controllerchange 重載，就強制重載
  function reload() {
    const timer = window.setTimeout(() => window.location.reload(), 2000);

    navigator.serviceWorker?.addEventListener(
      "controllerchange",
      () => window.clearTimeout(timer),
      { once: true },
    );

    void updateServiceWorker(true);
  }

  return (
    <>
      {needRefresh && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <Card
            role="alert"
            aria-labelledby="toast-message"
            className="w-full max-w-md gap-3 p-4 shadow-lg"
          >
            <p id="toast-message" className="text-sm text-muted-foreground">
              已有新版本內容，重新載入即可更新。
            </p>

            <div className="flex justify-end gap-2">
              <Button size="sm" onClick={reload}>
                重新載入
              </Button>
              <Button size="sm" variant="outline" onClick={close}>
                關閉
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

/**
 * 此函式會註冊一個週期性同步檢查（預設為每小時一次），可依需求自行調整間隔。
 */
function registerPeriodicSync(
  period: number,
  swUrl: string,
  r: ServiceWorkerRegistration,
) {
  if (period <= 0) {
    return;
  }

  setInterval(async () => {
    if ("onLine" in navigator && !navigator.onLine) {
      return;
    }

    const resp = await fetch(swUrl, {
      cache: "no-store",
      headers: {
        cache: "no-store",
        "cache-control": "no-cache",
      },
    });

    if (resp?.status === 200) {
      await r.update();
    }
  }, period);
}
