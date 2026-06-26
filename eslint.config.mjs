import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [".next/**", "node_modules/**", ".npm-cache/**", ".pnpm-store/**", "out/**", "dist/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: "module",
      },
      globals: {
        React: "readonly",
        JSX: "readonly",
        Request: "readonly",
        Response: "readonly",
        File: "readonly",
        FormData: "readonly",
        console: "readonly",
        process: "readonly",
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/triple-slash-reference": "off"
    },
  },
];
