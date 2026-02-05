import { useRegisterSW } from "virtual:pwa-register/react";

export default function PWABadge() {
  // 目前已停用週期性同步，如需啟用請調整此數值（單位為毫秒）
  // 若不需要週期性同步，可移除 onRegisteredSW callback 與 registerPeriodicSync 函式
  const period = 0;

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

  return (
    <>
      {needRefresh && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div
            role="alert"
            aria-labelledby="toast-message"
            className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-800 p-4 text-gray-100 shadow-lg"
          >
            <p id="toast-message" className="mb-3 text-sm text-gray-300">
              已有新版本內容，重新載入即可更新。
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => updateServiceWorker(true)}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
              >
                重新載入
              </button>
              <button
                onClick={close}
                className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-gray-700"
              >
                關閉
              </button>
            </div>
          </div>
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
