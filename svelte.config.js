import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: true,
  },
  kit: {
    // SPA build served by Express / nginx from dist/public with an index.html fallback.
    adapter: adapter({
      pages: "dist/public",
      assets: "dist/public",
      fallback: "index.html",
      strict: false,
    }),
    alias: {
      "@shared": "./shared",
    },
  },
};

export default config;
