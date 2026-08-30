import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default defineConfig({
  site: "https://www.roughatsea.com",
  output: "static",
  redirects: {
    "/notes/code-guru-rebuilt-recognition-first": "/notes/the-working-vocabulary-of-software-engineering/",
  },
  integrations: [mdx(), react(), sitemap()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: "github-dark-default",
      wrap: true,
    },
  },
});
