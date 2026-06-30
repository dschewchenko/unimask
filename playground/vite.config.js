import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue(), react()],
  resolve: {
    alias: [
      { find: "unimask/react", replacement: fileURLToPath(new URL("../src/react/index.ts", import.meta.url)) },
      { find: "unimask/vue", replacement: fileURLToPath(new URL("../src/vue/index.ts", import.meta.url)) },
      { find: "unimask", replacement: fileURLToPath(new URL("../src/index.ts", import.meta.url)) },
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
});
