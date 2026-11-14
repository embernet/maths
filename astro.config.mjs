import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeTheoremAutolinks from './src/lib/rehype-theorem-autolinks.mjs';
import rehypeBoldAutolinks from './src/lib/rehype-bold-autolinks.mjs';

export default defineConfig({
  // `hybrid` prerenders every page by default (so the whole site stays
  // static, as before) while still emitting the Cloudflare Worker entry
  // (`dist/_worker.js/index.js`) that the adapter requires.
  output: 'hybrid',
  adapter: cloudflare({
    // Serve static assets through the Workers runtime.
    imageService: 'passthrough',
  }),
  // Sharp is not available in the Cloudflare Workers runtime, so use the
  // noop (passthrough) image service instead of the default Sharp service.
  image: {
    service: { entrypoint: 'astro/assets/services/noop' },
  },
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
    ssr: {
      // These Node built-ins are only used at build time while prerendering
      // pages (reading content files from disk). Every page is prerendered, so
      // this code never runs in the Workers runtime — externalize the built-ins
      // so the Cloudflare worker bundle doesn't try to bundle them.
      external: ['node:fs', 'node:path', 'node:url'],
    },
  },
});
