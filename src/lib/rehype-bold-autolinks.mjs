/**
 * rehype-bold-autolinks.mjs
 *
 * Build-time rehype plugin: wraps every <strong> element whose text matches
 * a known definition or theorem slug in an <a> linking to its page.
 *
 * Resolution order for a bold term "X":
 *   1. If `/theorems/{slug(X)}` exists → link there (theorems trump definitions)
 *   2. Else if `/definitions/{slug(X)}` exists → link there
 *   3. Else: leave the <strong> alone
 *
 * Constraints:
 *   - Never wrap if the <strong> is already inside an <a> (ancestor scan).
 *   - Never self-link (the page IS the definition/theorem for that slug).
 *   - Skip <strong> inside code blocks, headings, math.
 */
import { readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { visitParents } from 'unist-util-visit-parents';

const __dirname = dirname(fileURLToPath(import.meta.url));
const THEOREMS_DIR = resolve(__dirname, '../../content/93-theorems');
const DEFS_DIR = resolve(__dirname, '../../content/95-definitions');

const SKIP_TAGS = new Set([
  'a', 'code', 'pre', 'script', 'style',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'mjx-container', 'math',
]);

function slugify(s) {
  // Same as the Python slugify used to generate definition pages
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')           // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadSlugSet(dir) {
  try {
    return new Set(
      readdirSync(dir)
        .filter((f) => f.endsWith('.mdx') && !f.startsWith('_'))
        .map((f) => f.replace(/\.mdx$/, ''))
    );
  } catch { return new Set(); }
}

function getStrongText(strongNode) {
  // Concatenate text children (depth 1; we don't support nested bold-in-bold)
  let out = '';
  if (!strongNode.children) return '';
  for (const c of strongNode.children) {
    if (c.type === 'text') out += c.value;
    else if (c.type === 'element' && c.children) {
      for (const c2 of c.children) {
        if (c2.type === 'text') out += c2.value;
      }
    }
  }
  return out.trim();
}

function ancestorHasSkipTag(ancestors) {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    if (a.type !== 'element') continue;
    if (SKIP_TAGS.has(a.tagName)) return true;
  }
  return false;
}

function currentSlug(vfile) {
  if (!vfile || !vfile.path) return null;
  const m = vfile.path.match(/content[\\/]9[35]-(?:theorems|definitions)[\\/]([^\\/]+)\.mdx$/);
  return m ? m[1] : null;
}

export default function rehypeBoldAutolinks() {
  const theoremSlugs = loadSlugSet(THEOREMS_DIR);
  const defSlugs = loadSlugSet(DEFS_DIR);

  return (tree, vfile) => {
    const ownSlug = currentSlug(vfile);

    visitParents(tree, 'element', (node, ancestors) => {
      if (node.tagName !== 'strong') return;
      if (ancestorHasSkipTag(ancestors)) return;

      const text = getStrongText(node);
      if (!text) return;
      // Trim trailing punctuation for slug lookup but keep displayed text intact
      const clean = text.replace(/[.,;:!?]+$/, '').trim();
      const slug = slugify(clean);
      if (!slug) return;
      if (slug === ownSlug) return; // no self-link

      let href = null;
      if (theoremSlugs.has(slug)) {
        href = `/theorems/${slug}`;
      } else if (defSlugs.has(slug)) {
        href = `/definitions/${slug}`;
      } else {
        return;
      }

      // Replace this <strong> with <a href><strong>...</strong></a>
      const parent = ancestors[ancestors.length - 1];
      if (!parent || !Array.isArray(parent.children)) return;
      const idx = parent.children.indexOf(node);
      if (idx < 0) return;

      const linkNode = {
        type: 'element',
        tagName: 'a',
        properties: { href, className: ['auto-bold-link'] },
        children: [node],
      };
      parent.children[idx] = linkNode;
    });
  };
}
