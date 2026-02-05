import { useState } from "react";

import PWABadge from "./components/PWABadge.tsx";
import { VersionBadge } from "./components/VersionBadge.tsx";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 text-gray-100">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-gray-800 p-6 shadow-lg">
        {/* Title */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-gray-100">vite-pwa</h1>
          <VersionBadge></VersionBadge>
        </div>

        {/* Card */}
        <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-900/40 p-4">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500 active:scale-[0.98]"
          >
            count is {count}
          </button>

          <p className="text-center text-lg font-semibold text-gray-300 underline">
            Hello world!
          </p>
        </div>

        {/* PWA badge */}
        <div className="flex justify-center">
          <PWABadge />
        </div>
      </div>
    </div>
  );
}
