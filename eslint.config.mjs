import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.browser } },
  { ignores: ["dist/*", "prisma/client"] },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
]
