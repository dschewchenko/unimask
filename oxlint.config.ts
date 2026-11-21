import nkzw from "@nkzw/oxlint-config";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [nkzw],
  env: { browser: true, builtin: true, es2024: true, node: true },
  ignorePatterns: ["dist/**", "node_modules/**", "playground/dist/**", "playground/node_modules/**"],
});
