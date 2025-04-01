/// <reference types="vitest/config" />
import {resolve} from "node:path";
import {defineConfig} from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: {
        'index': resolve(__dirname, 'src/index.ts'),
        'vue/index': resolve(__dirname, 'src/vue/index.ts'),
        'react/index': resolve(__dirname, 'src/react/index.ts')
      },
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue', 'react', 'react-dom'],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src'
      }
    },
    sourcemap: true,
    minify: true,
    outDir: 'dist'
  },
  plugins: [
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      include: ['src']
    })
  ],
  test: {
    environment: "jsdom",
    reporters: process.env.GITHUB_ACTIONS ? ["dot", "github-actions"] : ["dot"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      include: ["src/**/*.ts"],
      reportOnFailure: true
    }
  }
});
