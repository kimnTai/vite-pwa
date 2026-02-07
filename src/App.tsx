import ORC from "./components/ORC.tsx";
import PWABadge from "./components/PWABadge.tsx";
import { VersionBadge } from "./components/VersionBadge.tsx";

export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 text-gray-100">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-gray-800 p-6 shadow-lg">
        {/* Title */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-gray-100">vite-pwa-update</h1>
          <VersionBadge></VersionBadge>
        </div>

        {/* Card */}
        <ORC />

        {/* PWA badge */}
        <div className="flex justify-center">
          <PWABadge />
        </div>
      </div>
    </div>
  );
}
