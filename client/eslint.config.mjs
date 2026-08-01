// eslint.config.mjs
// Flat config for ESLint 9. We attach the Next.js plugin and the TypeScript
// parser directly instead of going through FlatCompat.extends("next/...").
// FlatCompat routes those presets through the old eslintrc validator, which
// crashes trying to JSON.stringify eslint-plugin-react's self-referential
// config ("Converting circular structure to JSON"). Wiring the pieces here
// side-steps that entirely.

import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";

const config = [
  // never lint build output / deps
  {
    ignores: [".next/**", "out/**", "build/**", "node_modules/**", "coverage/**", "next-env.d.ts"],
  },

  // base javascript rules
  js.configs.recommended,

  // parse ts/tsx with the typescript parser (no type-aware rules = fast, no project needed)
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: "module" },
    },
  },

  // next.js recommended + core-web-vitals
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

  // project tweaks: typescript + the automatic jsx runtime cover these, so the
  // plain base-rule versions only produce noise/false positives here
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        React: "readonly",
        JSX: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        localStorage: "readonly",
        confirm: "readonly",
        alert: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-empty": "off",
    },
  },
];

export default config;
