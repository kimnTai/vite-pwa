import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

const MEDIA_QUERY = "(orientation: landscape) and (max-height: 500px)";

export function OrientationGuard() {
  const [isLandscape, setIsLandscape] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(MEDIA_QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(MEDIA_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsLandscape(e.matches);

    mql.addEventListener("change", handler);

    // 順手嘗試以 Screen Orientation API 鎖定；iOS Safari 與非 standalone 會 reject，忽略即可
    void screen.orientation?.lock?.("portrait-primary").catch(() => {});

    return () => mql.removeEventListener("change", handler);
  }, []);

  if (!isLandscape) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center gap-3 bg-background px-6 text-center text-foreground">
      <div className="flex flex-col items-center gap-3">
        <RotateCcw className="size-10 animate-pulse text-primary" />
        <p className="text-lg font-medium">請將裝置轉為直向使用</p>
        <p className="text-sm text-muted-foreground">本應用僅支援直向操作</p>
      </div>
    </div>
  );
}
