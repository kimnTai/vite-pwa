import ImageOcr from "./components/ImageOcr.tsx";
import PWABadge from "./components/PWABadge.tsx";
import { VersionBadge } from "./components/VersionBadge.tsx";

export default function App() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-900 px-3 py-6 text-gray-100 sm:items-center sm:px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-gray-800 p-4 shadow-lg sm:max-w-lg sm:p-6">
        {/* Title */}
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold text-gray-100 sm:text-2xl">
            圖片文字辨識
          </h1>
          <p className="text-xs text-gray-400">上傳圖片，於前端解析其中文字</p>
          <VersionBadge></VersionBadge>
        </div>

        {/* OCR */}
        <ImageOcr />

        {/* PWA badge */}
        <div className="flex justify-center">
          <PWABadge />
        </div>
      </div>
    </div>
  );
}
