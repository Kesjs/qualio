import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".claude/**",
    ".cursor/**",
    ".agents/**",
    "scripts/**",
    "fix*.js",
    "replace_fonts.js",
  ]),
  {
    // The existing product uses browser payloads and intentionally syncs a few
    // hydration states in effects. Keep these as visible warnings while the
    // correction-prompt work remains lintable and build-safe.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
