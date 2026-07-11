import backgroundUrl from "@/assets/background.webp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import ImageOcr from "./components/ImageOcr.tsx";
import PWABadge from "./components/PWABadge.tsx";
import { VersionBadge } from "./components/VersionBadge.tsx";

export default function App() {
  return (
    <div
      className="relative flex min-h-screen items-start justify-center bg-background bg-cover bg-center bg-no-repeat px-3 py-6 text-foreground sm:items-center sm:px-4"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      {/* 半透明遮罩：提升卡片可讀性，並隨主題深淺自動調整 */}
      <div className="pointer-events-none absolute inset-0 bg-background/60 backdrop-blur-xs" />

      <Card className="relative z-10 w-full max-w-md sm:max-w-lg">
        {/* Title */}
        <CardHeader className="justify-items-center text-center">
          <CardTitle className="text-xl sm:text-2xl">圖片文字辨識</CardTitle>
          <p className="text-xs text-muted-foreground">
            上傳圖片，於前端解析其中文字
          </p>
          <VersionBadge />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* OCR */}
          <ImageOcr />

          {/* PWA badge */}
          <div className="flex justify-center">
            <PWABadge />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
