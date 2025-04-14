import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.browser } },
  { ignores: ["dist/", "prisma/client", "coverage/"] },
  {
    rules: {
      "@typescript-eslint/ban-ts-comment": {
        "ts-ignore": false,
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
]
