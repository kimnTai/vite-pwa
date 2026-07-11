import { Download, Share, SquarePlus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useInstallPrompt } from "../hooks/useInstallPrompt";

// 使用者關掉 iOS 引導後，記錄於 localStorage，避免每次進站都打擾
const IOS_DISMISS_KEY = "install-ios-hint-dismissed";

export default function InstallPrompt() {
  const { platform, canInstall, promptInstall } = useInstallPrompt();
  const [iosDismissed, setIosDismissed] = useState(
    () => localStorage.getItem(IOS_DISMISS_KEY) === "1",
  );

  // Android/Chrome：瀏覽器已備妥安裝提示，顯示自訂按鈕
  if (platform === "android" && canInstall) {
    return (
      <Button variant="outline" size="sm" onClick={() => void promptInstall()}>
        <Download data-icon="inline-start" />
        安裝到主畫面
      </Button>
    );
  }

  // iOS Safari：沒有安裝事件，只能引導使用者手動加入
  if (platform === "ios" && !iosDismissed) {
    function dismiss() {
      localStorage.setItem(IOS_DISMISS_KEY, "1");
      setIosDismissed(true);
    }

    return (
      <Card className="relative w-full max-w-md gap-2 p-3 text-left">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={dismiss}
          aria-label="關閉安裝提示"
          className="absolute end-2 top-2"
        >
          <X />
        </Button>

        <p className="pe-6 text-sm font-medium">將此頁加入主畫面</p>
        <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          點下方
          <Share className="inline size-3.5" aria-label="分享" />
          分享鈕，選擇
          <SquarePlus className="inline size-3.5" aria-label="加入主畫面" />
          「加入主畫面」即可。
        </p>
      </Card>
    );
  }

  // 已安裝，或非支援環境：不顯示任何內容
  return null;
}
