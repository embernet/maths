/**
 * integration-base-path.mjs — Astro integration (two build-time jobs).
 *
 * 1. LINK REWRITE. Astro's `base` prefixes its own bundled assets (`_astro/*`)
 *    but deliberately does NOT rewrite author-written links. This project has
 *    ~1000 absolute links in MDX content plus dozens in .astro templates
 *    (`href="/theorems"`, `href={`/mathematicians/${slug}`}`, etc). In the
 *    emitted HTML every one normalises to a plain `href="/..."` / `src="/..."`,
 *    so a single pass over the built HTML prefixes them all with the base.
 *
 * 2. SITEMAP. `@astrojs/sitemap` does not build cleanly with this hybrid +
 *    Cloudflare + base setup, so the sitemap is generated here instead: while
 *    walking the output we collect each page's canonical URL and write
 *    `<base>/sitemap.xml` with absolute, trailing-slash URLs.
 *
 * Runs in `astro:build:done`. Link rewrite skips external/protocol-relative/
 * scheme/hash URLs and anything already under the base.
 */
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';

// Matches href/src attribute values that begin with a single "/".
const ATTR_RE = /\b(href|src)=("|')(\/[^"']*)\2/g;

function rewriteHtml(html, base) {
  return html.replace(ATTR_RE, (match, attr, quote, url) => {
    if (url.startsWith('//')) return match; // protocol-relative
    if (url === base || url.startsWith(base + '/')) return match; // already based
    return `${attr}=${quote}${base}${url}${quote}`;
  });
}

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* htmlFiles(full);
    } else if (entry.name.endsWith('.html')) {
      yield full;
    }
  }
}

/** Absolute, trailing-slash URL for an HTML file (or null to skip). */
function fileToUrl(file, baseDir, base, site) {
  const rel = relative(baseDir, file).split(sep).join('/');
  if (rel === '404.html' || rel.endsWith('/404.html')) return null;
  const sub = rel.replace(/index\.html$/, '').replace(/\.html$/, '/');
  const path = `${base}/${sub}`.replace(/\/{2,}/g, '/'); // base + sub, no double slashes
  return new URL(path.endsWith('/') ? path : `${path}/`, site).href;
}

/** @param {{ base: string, site: string }} options */
export default function basePath({ base, site }) {
  const baseSeg = base.replace(/^\//, '').replace(/\/$/, ''); // "maths"
  return {
    name: 'base-path-link-rewrite',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        // Astro nests output under the base. Depending on the adapter, `dir` is
        // either the project output root (…/dist) or the base dir (…/dist/maths).
        // Resolve the base dir where the pages actually live.
        let baseDir = outDir;
        try {
          if ((await stat(join(outDir, baseSeg))).isDirectory()) baseDir = join(outDir, baseSeg);
        } catch { /* outDir is already the base dir */ }

        const urls = [];
        let rewritten = 0;
        for await (const file of htmlFiles(baseDir)) {
          const html = await readFile(file, 'utf8');
          const next = rewriteHtml(html, base);
          if (next !== html) {
            await writeFile(file, next, 'utf8');
            rewritten++;
          }
          const url = fileToUrl(file, baseDir, base, site);
          if (url) urls.push(url);
        }
        logger.info(`Rewrote root-absolute links to base "${base}" in ${rewritten} HTML file(s).`);

        // Write the sitemap at the base root (served at `${base}/sitemap.xml`).
        urls.sort();
        const sitemap =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n') +
          `\n</urlset>\n`;
        await writeFile(join(baseDir, 'sitemap.xml'), sitemap, 'utf8');
        logger.info(`Wrote sitemap with ${urls.length} URL(s) to ${base}/sitemap.xml.`);
      },
    },
  };
}
