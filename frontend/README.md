# Soft Robot Frontend

A React + TypeScript + Vite application for soft robot parameter computation and visualization.

## Features

- **Retry Mechanism**: Automatic retry logic for failed API calls with exponential backoff
- **Real-time Validation**: Form validation with immediate feedback
- **3D Visualization**: Interactive 3D robot visualization using Three.js
- **Responsive Design**: Modern UI with Tailwind CSS

## API Retry Mechanism

The application includes a robust retry mechanism for handling network failures:

### Automatic Retry

All API calls automatically retry on:

- Network timeouts and connection errors
- HTTP 408, 429, 500, 502, 503, 504 status codes
- Exponential backoff with configurable delays

### Usage

```typescript
// Basic usage (automatic retry)
const result = await robotAPI.computePCC(params);

// Custom retry configuration
const result = await robotAPI.computePCC(params, {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 10000,
});
```

### React Hook

```typescript
import { useRetryAPI } from "../hooks/useRetryAPI";

const { data, loading, error, execute, reset } = useRetryAPI();

const handleSubmit = async () => {
  const result = await execute(params);
  if (result) {
    // Handle success
  }
};
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
