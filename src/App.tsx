import "./App.css";

import { useState } from "react";

import PWABadge from "./PWABadge.tsx";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>vite-pwa</h1>
      <h3>{VERSION}</h3>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <PWABadge />
    </>
  );
}
