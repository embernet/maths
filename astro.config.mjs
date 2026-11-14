import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeTheoremAutolinks from './src/lib/rehype-theorem-autolinks.mjs';
import rehypeBoldAutolinks from './src/lib/rehype-bold-autolinks.mjs';
import basePath from './src/lib/integration-base-path.mjs';
import { BASE, SITE_ORIGIN } from './src/lib/site-config.mjs';

export default defineConfig({
  // NOTE: we intentionally do NOT set `site` here. Setting it perturbs the SSR
  // chunking and intermittently triggers an Astro build bug ("Unable to find
  // the module for …"). Absolute URLs (canonical/OG/sitemap) are built from
  // SITE_ORIGIN in site-config.mjs instead. See that file for details.
  //
  // Deployed under a sub-path via the Cloudflare Workers route
  // `tapestrylab.net/maths*`, so the whole app is served at `/maths`.
  base: BASE,
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
    // Prefix author-written root-absolute links (`/theorems`, MDX `](/...)`,
    // etc.) with the base in the built HTML — Astro does not do this itself —
    // and emit sitemap.xml for the sub-path deployment.
    basePath({ base: BASE, site: SITE_ORIGIN }),
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
