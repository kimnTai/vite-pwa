import { fileURLToPath } from "node:url";

import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["test/**/*.test.ts"],
          exclude: ["test/**/*.browser.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["test/**/*.browser.test.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
