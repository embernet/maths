#!/usr/bin/env node
/**
 * check-katex-hide-rule.mjs
 *
 * Post-build regression check. Fails the build with a non-zero exit code
 * if any page in dist/ is missing the inline KaTeX-MathML hide rule.
 *
 * Background: KaTeX renders BOTH a .katex-mathml span (for screen readers)
 * AND a .katex-html span (visible glyphs). If the hide rule for .katex-mathml
 * is not applied — wrong bundle, stale service-worker cache, dev-server
 * quirk — both render visibly and the page shows doubled math output like
 * "f:A→B  f:A→B". An inline <style> block in BaseLayout's <head> provides a
 * hard backstop. This check verifies that backstop is present on every page.
 *
 * Looks for the sentinel string `clip-path: inset(50%) !important` which is
 * unique to the inline hide rule. Pages without it are flagged and the
 * script exits 1.
 *
 * Wired in package.json as a `postbuild` script so it runs after every build.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const SENTINEL = 'clip-path: inset(50%) !important';
const DIST = process.argv[2] ?? 'dist';

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    try {
      const s = statSync(full);
      if (s.isDirectory()) yield* walk(full);
      else if (extname(entry) === '.html') yield full;
    } catch { /* ignore */ }
  }
}

const missing = [];
let total = 0;

for (const file of walk(DIST)) {
  total++;
  const html = readFileSync(file, 'utf8');
  if (!html.includes(SENTINEL)) missing.push(file);
}

if (missing.length) {
  console.error(`\nKaTeX hide-rule check FAILED — ${missing.length}/${total} pages are missing the inline backstop.`);
  console.error('\nThis means doubled-math rendering (".katex-mathml" + ".katex-html" both visible) is possible on these pages:');
  for (const f of missing.slice(0, 20)) console.error(`  - ${f.replace(DIST + '/', '')}`);
  if (missing.length > 20) console.error(`  ... and ${missing.length - 20} more`);
  console.error('\nFix: ensure the inline <style is:global> block in src/layouts/BaseLayout.astro renders on every page.');
  process.exit(1);
}

console.log(`KaTeX hide-rule check OK — sentinel present on all ${total} pages.`);
