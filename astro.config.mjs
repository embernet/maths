import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeTheoremAutolinks from './src/lib/rehype-theorem-autolinks.mjs';
import rehypeBoldAutolinks from './src/lib/rehype-bold-autolinks.mjs';

export default defineConfig({
  output: 'static',
  integrations: [
    mdx(),
    tailwind({ applyBaseStyles: false }),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, rehypeBoldAutolinks, rehypeTheoremAutolinks],
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
  vite: {
    // Workaround: prevent Vite from trying to find tsconfig for virtual Astro entry modules.
    optimizeDeps: {
      exclude: [],
    },
  },
});
