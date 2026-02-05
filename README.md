# React + TypeScript + Vite

https://kimntai.github.io/vite-pwa/

此範本提供一個最簡化的設定，讓 React 在 Vite 中運作，並支援熱模組替換（HMR）以及一些 ESLint 規則。

目前，有兩個官方外掛可用：

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) 使用 [Babel](https://babeljs.io/)（或在 [rolldown-vite](https://vite.dev/guide/rolldown) 中使用時為 [oxc](https://oxc.rs)）來實現快速刷新（Fast Refresh）
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) 使用 [SWC](https://swc.rs/) 來實現快速刷新（Fast Refresh）

## React 編譯器

此範本未啟用 React 編譯器，因為它會影響開發與建置的效能。如需添加，請參考[此文件](https://react.dev/learn/react-compiler/installation)。

## 擴充 ESLint 設定

如果您正在開發生產環境應用程式，建議更新設定以啟用類型感知的檢查規則：

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // 其他設定...

      // 移除 tseslint.configs.recommended，改為使用此設定
      tseslint.configs.recommendedTypeChecked,
      // 或者，使用此設定以啟用更嚴格的規則
      tseslint.configs.strictTypeChecked,
      // 選擇性地，加入此設定以啟用風格相關的規則
      tseslint.configs.stylisticTypeChecked,

      // 其他設定...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // 其他選項...
    },
  },
]);
```

您也可以安裝 [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) 和 [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) 來取得 React 專用的檢查規則：

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // 其他設定...
      // 啟用 React 的檢查規則
      reactX.configs["recommended-typescript"],
      // 啟用 React DOM 的檢查規則
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // 其他選項...
    },
  },
]);
```
