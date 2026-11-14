/**
 * integration-base-path.mjs — Astro integration.
 *
 * Astro's `base` prefixes its own bundled assets (`_astro/*`) but deliberately
 * does NOT rewrite author-written links. This project has ~1000 absolute links
 * in MDX content plus dozens in .astro templates (`href="/theorems"`,
 * `href={`/mathematicians/${slug}`}`, etc). In the emitted HTML every one of
 * those normalises to a plain `href="/..."` / `src="/..."`, so a single pass
 * over the built HTML can prefix them all with the base — regardless of how
 * they were authored.
 *
 * Runs in `astro:build:done`, rewriting every .html file under the output dir.
 * Skips: external/protocol-relative/scheme/hash URLs and anything already under
 * the base (so Astro's own `/maths/_astro/...` links are left alone).
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

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

/** @param {{ base: string }} options */
export default function basePath({ base }) {
  return {
    name: 'base-path-link-rewrite',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        let count = 0;
        for await (const file of htmlFiles(outDir)) {
          const html = await readFile(file, 'utf8');
          const rewritten = rewriteHtml(html, base);
          if (rewritten !== html) {
            await writeFile(file, rewritten, 'utf8');
            count++;
          }
        }
        logger.info(`Rewrote root-absolute links to base "${base}" in ${count} HTML file(s).`);
      },
    },
  };
}
