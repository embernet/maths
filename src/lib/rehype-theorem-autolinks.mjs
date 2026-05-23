/**
 * rehype-theorem-autolinks.mjs
 *
 * Build-time rehype plugin: scans the rendered HTML AST of every MDX page
 * and turns the first plain-text mention of each theorem title into a link
 * to `/theorems/{slug}`.
 *
 * Constraints:
 *   - One link per theorem per page (no noise from repeated mentions).
 *   - Never link text inside <a>, <code>, <pre>, headings (h1..h6), math
 *     containers (.katex, mjx-container), or aside/nav elements.
 *   - Never link a theorem to its own page (detected by VFile path).
 *   - Match the title as a whole phrase, case-insensitive, with word
 *     boundaries; also match the possessive form ("Pythagoras's theorem"
 *     when the title is "The Pythagorean Theorem" — handled by aliases).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { visitParents } from 'unist-util-visit-parents';

const __dirname = dirname(fileURLToPath(import.meta.url));
const THEOREMS_DIR = resolve(__dirname, '../../content/93-theorems');

const SKIP_TAGS = new Set([
  'a', 'code', 'pre', 'script', 'style',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'mjx-container', 'math', 'nav', 'aside',
]);

const SKIP_CLASSES = new Set(['katex', 'katex-html', 'katex-mathml', 'katex-display']);

/** Heuristic: a title is safe to auto-link when it includes a "category" word
 *  (theorem, identity, etc.), contains a possessive, or is a multi-word
 *  compound name. Single common words are excluded. */
const SAFE_CATEGORY = /\b(theorem|identit(y|ies)|inequalit(y|ies)|principle|law|axiom|lemma|hypothes(is|es)|paradox|formula|conjecture|transform|equation|function|algorithm|series|integral|distribution|sequence|space|spaces|group|groups|set|sets|number|numbers|domain|cuts|argument|fixed-point)\b/i;

function buildLinkMap() {
  const aliases = []; // array of { pattern: RegExp, slug, title }
  const seen = new Set();

  let files;
  try {
    files = readdirSync(THEOREMS_DIR);
  } catch {
    return aliases;
  }

  for (const filename of files) {
    if (!filename.endsWith('.mdx') || filename.startsWith('_')) continue;
    const slug = filename.replace(/\.mdx$/, '');
    const path = join(THEOREMS_DIR, filename);
    let raw;
    try { raw = readFileSync(path, 'utf8'); } catch { continue; }
    const { data: fm } = matter(raw);
    if (!fm.title || typeof fm.title !== 'string') continue;
    const title = fm.title.trim();

    // Generate aliases to try, longest first to avoid prefix collisions.
    const variants = new Set();
    variants.add(title);
    variants.add(title.replace(/^The\s+/i, ''));        // strip leading "The"
    variants.add(title.replace(/['']s\b/g, "'s"));      // normalise apostrophe
    variants.add(title.replace(/['']s\b/g, ''));        // strip possessive
    variants.add(title.replace(/\s*\([^)]*\)\s*$/, '')); // strip trailing "(...)"

    for (const v of variants) {
      const clean = v.replace(/\s+/g, ' ').trim();
      if (!clean) continue;
      if (clean.length < 8) continue;                         // too short
      if (!/[A-Z]/.test(clean)) continue;                      // needs a proper noun
      const wordCount = clean.split(/\s+/).length;
      if (wordCount < 2) continue;                             // single common words are too noisy
      if (wordCount === 2 && !SAFE_CATEGORY.test(clean) && !/['']/.test(clean)) {
        continue; // two-word non-category pairs (e.g. "Banach spaces") allowed only via SAFE_CATEGORY
      }
      const key = clean.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      // Build word-boundary regex.
      // Treat hyphen / en-dash / em-dash as equivalent so body text written
      // with plain "-" still matches a title written with "–" or "—".
      const escaped = clean
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/['']/g, "['‘’]")
        .replace(/[-–—]/g, '[-–—]');
      const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
      aliases.push({ pattern, slug, title, alias: clean });
    }
  }

  // Sort by alias length DESC so longer phrases match first (avoid "Cauchy" eating "Cauchy-Schwarz inequality").
  aliases.sort((a, b) => b.alias.length - a.alias.length);
  return aliases;
}

function ancestorHasTagOrClass(ancestors) {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    if (a.type !== 'element') continue;
    if (SKIP_TAGS.has(a.tagName)) return true;
    const cls = a.properties && a.properties.className;
    if (Array.isArray(cls)) {
      for (const c of cls) if (SKIP_CLASSES.has(c)) return true;
    } else if (typeof cls === 'string') {
      for (const c of cls.split(/\s+/)) if (SKIP_CLASSES.has(c)) return true;
    }
  }
  return false;
}

function currentSlug(vfile) {
  if (!vfile || !vfile.path) return null;
  // file path like .../content/93-theorems/{slug}.mdx
  const m = vfile.path.match(/content[\\/]93-theorems[\\/]([^\\/]+)\.mdx$/);
  return m ? m[1] : null;
}

export default function rehypeTheoremAutolinks() {
  const aliases = buildLinkMap();
  return (tree, vfile) => {
    if (!aliases.length) return;
    const ownSlug = currentSlug(vfile);
    const usedSlugs = new Set();

    visitParents(tree, 'text', (node, ancestors) => {
      if (!node.value) return;
      if (ancestorHasTagOrClass(ancestors)) return;
      const parent = ancestors[ancestors.length - 1];
      if (!parent || !Array.isArray(parent.children)) return;

      let text = node.value;
      let replaced = false;
      const newChildren = [];
      let cursor = 0;
      let searchFrom = 0;

      while (true) {
        let bestMatch = null;
        for (const a of aliases) {
          if (a.slug === ownSlug) continue;
          if (usedSlugs.has(a.slug)) continue;
          const m = text.slice(searchFrom).match(a.pattern);
          if (!m) continue;
          const start = searchFrom + m.index;
          if (bestMatch == null || start < bestMatch.start ||
              (start === bestMatch.start && m[0].length > bestMatch.matched.length)) {
            bestMatch = { start, matched: m[0], slug: a.slug };
          }
        }
        if (!bestMatch) break;
        if (bestMatch.start > cursor) {
          newChildren.push({ type: 'text', value: text.slice(cursor, bestMatch.start) });
        }
        newChildren.push({
          type: 'element',
          tagName: 'a',
          properties: { href: `/theorems/${bestMatch.slug}`, className: ['auto-theorem-link'] },
          children: [{ type: 'text', value: bestMatch.matched }],
        });
        cursor = bestMatch.start + bestMatch.matched.length;
        searchFrom = cursor;
        usedSlugs.add(bestMatch.slug);
        replaced = true;
      }

      if (replaced) {
        if (cursor < text.length) {
          newChildren.push({ type: 'text', value: text.slice(cursor) });
        }
        const idx = parent.children.indexOf(node);
        parent.children.splice(idx, 1, ...newChildren);
        return idx + newChildren.length;
      }
    });
  };
}
