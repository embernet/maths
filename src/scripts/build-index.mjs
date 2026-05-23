/**
 * build-index.mjs
 *
 * Walks content/, reads frontmatter from every page MDX,
 * and writes:
 *   public/api/index.json    — Fuse.js search index (all pages)
 *   public/api/backlinks.json — cross-link map keyed by canonical slug
 *
 * Each search record:
 * { title, section, slug, kind, summary, tags, mathematicians, url }
 *
 * Run automatically via `prebuild` in package.json.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..', '..');
const contentDir = join(root, 'content');
const outputDir = join(root, 'public', 'api');
const outputFile = join(outputDir, 'index.json');
const backlinksFile = join(outputDir, 'backlinks.json');

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

/** Extract YAML frontmatter from an MDX/MD file. Returns object or null. */
function parseFrontmatter(filePath) {
  let text;
  try { text = readFileSync(filePath, 'utf8'); } catch { return null; }

  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;

  const yamlBlock = text.slice(3, end).trim();
  const result = {};

  for (const line of yamlBlock.split('\n')) {
    const m = line.match(/^(\w[\w_]*)\s*:\s*(.*)/);
    if (!m) continue;
    const [, key, rawVal] = m;
    const val = rawVal.trim();

    if (val.startsWith('[')) {
      result[key] = val
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else if (val === 'true') {
      result[key] = true;
    } else if (val === 'false') {
      result[key] = false;
    } else if (!isNaN(Number(val)) && val !== '') {
      result[key] = Number(val);
    } else {
      result[key] = val.replace(/^["']|["']$/g, '');
    }
  }
  return result;
}

/** Scan an MDX body for /theorems/{slug} and /applications/{slug} hrefs */
function scanBodyLinks(filePath) {
  const theoremLinks = new Set();
  const appLinks = new Set();
  let text = '';
  try { text = readFileSync(filePath, 'utf8'); } catch { return { theoremLinks, appLinks }; }

  // Strip frontmatter
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3);
    if (end !== -1) text = text.slice(end + 4);
  }

  for (const m of text.matchAll(/href=["']\/theorems\/([a-z0-9-]+)["']/g)) {
    theoremLinks.add(m[1]);
  }
  for (const m of text.matchAll(/\(\/theorems\/([a-z0-9-]+)\)/g)) {
    theoremLinks.add(m[1]);
  }
  for (const m of text.matchAll(/href=["']\/applications\/([a-z0-9-]+)["']/g)) {
    appLinks.add(m[1]);
  }
  for (const m of text.matchAll(/\(\/applications\/([a-z0-9-]+)\)/g)) {
    appLinks.add(m[1]);
  }
  return { theoremLinks, appLinks };
}

const records = [];
// backlinks: keyed by theorem/application slug
const backlinks = {};

function ensureBacklink(slug) {
  if (!backlinks[slug]) {
    backlinks[slug] = {
      attributed_to: [],
      appears_in_topics: [],
      appears_in_eras: [],
      used_in_applications: [],
      uses_theorems: [],
      uses_topics: [],
    };
  }
  return backlinks[slug];
}

if (!existsSync(contentDir)) {
  writeFileSync(outputFile, '[]', 'utf8');
  writeFileSync(backlinksFile, '{}', 'utf8');
  console.log('[build-index] content/ not found — wrote empty index.json and backlinks.json');
  process.exit(0);
}

const topLevelEntries = readdirSync(contentDir);

for (const entry of topLevelEntries) {
  const entryPath = join(contentDir, entry);
  if (!statSync(entryPath).isDirectory()) continue;

  // ---------- Mathematician pages (91-mathematicians) ----------
  if (entry === '91-mathematicians') {
    for (const file of readdirSync(entryPath)) {
      if (extname(file) !== '.mdx') continue;
      const slug = basename(file, '.mdx');
      if (slug === 'index') continue;
      const fm = parseFrontmatter(join(entryPath, file));
      if (!fm || !fm.title) continue;

      records.push({
        title: fm.title,
        section: 'Mathematicians',
        slug,
        kind: 'mathematician',
        summary: fm.hook ?? fm.summary ?? '',
        tags: fm.tags ?? [],
        mathematicians: [],
        url: `/mathematicians/${slug}`,
      });
    }
    continue;
  }

  // ---------- Welcome ----------
  if (entry === '00-welcome') {
    const fm = parseFrontmatter(join(entryPath, 'index.mdx'));
    if (fm && fm.title) {
      records.push({
        title: fm.title,
        section: 'Welcome',
        slug: 'welcome',
        kind: 'page',
        summary: fm.summary ?? '',
        tags: fm.tags ?? [],
        mathematicians: [],
        url: '/',
      });
    }
    continue;
  }

  // ---------- Resources ----------
  if (entry === '92-resources') {
    const fm = parseFrontmatter(join(entryPath, 'index.mdx'));
    if (fm && fm.title) {
      records.push({
        title: fm.title,
        section: 'Resources',
        slug: 'resources',
        kind: 'page',
        summary: fm.summary ?? '',
        tags: fm.tags ?? [],
        mathematicians: [],
        url: '/resources',
      });
    }
    continue;
  }

  // ---------- History section (90-history) ----------
  if (entry === '90-history') {
    for (const sub of readdirSync(entryPath)) {
      const subPath = join(entryPath, sub);
      if (!statSync(subPath).isDirectory()) continue;
      const filePath = join(subPath, 'index.mdx');
      const fm = parseFrontmatter(filePath);
      if (!fm || !fm.title) continue;
      const slug = sub.replace(/^\d+-/, '');
      records.push({
        title: fm.title,
        section: 'A Brief History of Mathematics',
        slug,
        kind: 'era',
        summary: fm.summary ?? '',
        tags: fm.tags ?? [],
        mathematicians: fm.key_figures ?? [],
        url: `/90-history/${sub}`,
      });

      // Backlinks: theorems appearing in this era
      const eraTheorems = fm.theorems ?? [];
      for (const tSlug of eraTheorems) {
        const bl = ensureBacklink(tSlug);
        if (!bl.appears_in_eras.includes(sub)) bl.appears_in_eras.push(sub);
      }

      // Scan body links
      const { theoremLinks, appLinks } = scanBodyLinks(filePath);
      for (const tSlug of theoremLinks) {
        const bl = ensureBacklink(tSlug);
        if (!bl.appears_in_eras.includes(sub)) bl.appears_in_eras.push(sub);
      }
      for (const aSlug of appLinks) {
        const bl = ensureBacklink(aSlug);
        if (!bl.used_in_applications) bl.used_in_applications = [];
        if (!bl.used_in_applications.includes(sub)) bl.used_in_applications.push(sub);
      }
    }
    continue;
  }

  // ---------- Theorems (93-theorems) ----------
  if (entry === '93-theorems') {
    // Load slug map for stubs
    const slugMapPath = join(entryPath, '_slug-map.json');
    let slugMap = {};
    if (existsSync(slugMapPath)) {
      try { slugMap = JSON.parse(readFileSync(slugMapPath, 'utf8')); } catch { /* ignore */ }
    }

    // Add MDX pages first
    const foundSlugs = new Set();
    for (const file of readdirSync(entryPath)) {
      if (extname(file) !== '.mdx') continue;
      const slug = basename(file, '.mdx');
      if (slug === 'index') continue;
      foundSlugs.add(slug);
      const filePath = join(entryPath, file);
      const fm = parseFrontmatter(filePath);
      if (!fm) continue;
      const title = fm.title ?? slug;

      records.push({
        title,
        section: 'Theorems',
        slug,
        kind: 'theorem',
        summary: fm.summary ?? '',
        tags: fm.tags ?? [],
        mathematicians: fm.attributed_to ?? [],
        url: `/theorems/${slug}`,
      });

      // Backlinks from frontmatter
      const bl = ensureBacklink(slug);
      bl.attributed_to = fm.attributed_to ?? [];

      for (const topicPath of fm.appears_in ?? []) {
        if (!bl.appears_in_topics.includes(topicPath)) bl.appears_in_topics.push(topicPath);
      }
      if (fm.era) {
        if (!bl.appears_in_eras.includes(fm.era)) bl.appears_in_eras.push(fm.era);
      }
      for (const appSlug of fm.applications ?? []) {
        if (!bl.used_in_applications.includes(appSlug)) bl.used_in_applications.push(appSlug);
      }

      // Scan body links
      const { theoremLinks, appLinks } = scanBodyLinks(filePath);
      for (const tSlug of theoremLinks) {
        if (tSlug !== slug) {
          const otherBl = ensureBacklink(tSlug);
          // cross-reference: this theorem's body links to tSlug — record that in a related field
        }
      }
      for (const aSlug of appLinks) {
        if (!bl.used_in_applications.includes(aSlug)) bl.used_in_applications.push(aSlug);
      }
    }

    // Add slug-map stubs not already in MDX
    for (const [slug, entry2] of Object.entries(slugMap)) {
      if (foundSlugs.has(slug)) continue;
      records.push({
        title: entry2.title ?? slug,
        section: 'Theorems',
        slug,
        kind: 'theorem',
        summary: '',
        tags: [],
        mathematicians: entry2.attributed_to ?? [],
        url: `/theorems/${slug}`,
      });
      const bl = ensureBacklink(slug);
      bl.attributed_to = entry2.attributed_to ?? [];
    }
    continue;
  }

  // ---------- Applications (94-applications) ----------
  if (entry === '94-applications') {
    for (const file of readdirSync(entryPath)) {
      if (extname(file) !== '.mdx') continue;
      const slug = basename(file, '.mdx');
      if (slug === 'index') continue;
      const filePath = join(entryPath, file);
      const fm = parseFrontmatter(filePath);
      if (!fm) continue;
      const title = fm.title ?? slug;

      records.push({
        title,
        section: 'Real-world applications',
        slug,
        kind: 'application',
        summary: fm.summary ?? '',
        tags: fm.tags ?? [],
        mathematicians: [],
        url: `/applications/${slug}`,
      });

      // Backlinks
      const bl = ensureBacklink(slug);
      bl.uses_theorems = fm.uses_theorems ?? [];
      bl.uses_topics = fm.uses_topics ?? [];

      // Each theorem this application uses should know about it
      for (const tSlug of fm.uses_theorems ?? []) {
        const tbl = ensureBacklink(tSlug);
        if (!tbl.used_in_applications.includes(slug)) tbl.used_in_applications.push(slug);
      }

      // Scan body links
      const { theoremLinks } = scanBodyLinks(filePath);
      for (const tSlug of theoremLinks) {
        const tbl = ensureBacklink(tSlug);
        if (!tbl.used_in_applications.includes(slug)) tbl.used_in_applications.push(slug);
        if (!bl.uses_theorems.includes(tSlug)) bl.uses_theorems.push(tSlug);
      }
    }
    continue;
  }

  // ---------- Main year sections (01–04) ----------
  let sectionTitle = entry.replace(/^\d+-/, '').replace(/-/g, ' ');
  const sectionJsonPath = join(entryPath, '_section.json');
  if (existsSync(sectionJsonPath)) {
    try {
      const sec = JSON.parse(readFileSync(sectionJsonPath, 'utf8'));
      if (sec.title) sectionTitle = sec.title;
    } catch { /* ignore */ }
  }

  for (const sub of readdirSync(entryPath)) {
    const subPath = join(entryPath, sub);
    if (!statSync(subPath).isDirectory()) continue;
    const mdxFilePath = join(subPath, 'index.mdx');
    if (!existsSync(mdxFilePath)) continue;

    const fm = parseFrontmatter(mdxFilePath);
    if (!fm || !fm.title) continue;

    const topicSlug = sub.replace(/^\d+-/, '');
    const topicPath = `${entry}/${sub}`;

    records.push({
      title: fm.title,
      section: sectionTitle,
      slug: topicSlug,
      kind: 'topic',
      summary: fm.summary ?? '',
      tags: fm.tags ?? [],
      mathematicians: fm.mathematicians ?? [],
      url: `/${entry}/${sub}`,
    });

    // Backlinks from topic frontmatter
    for (const tSlug of fm.theorems ?? []) {
      const bl = ensureBacklink(tSlug);
      if (!bl.appears_in_topics.includes(topicPath)) bl.appears_in_topics.push(topicPath);
    }

    // Scan body for theorem/application links
    const { theoremLinks, appLinks } = scanBodyLinks(mdxFilePath);
    for (const tSlug of theoremLinks) {
      const bl = ensureBacklink(tSlug);
      if (!bl.appears_in_topics.includes(topicPath)) bl.appears_in_topics.push(topicPath);
    }
    for (const aSlug of appLinks) {
      const bl = ensureBacklink(aSlug);
      if (!bl.uses_topics) bl.uses_topics = [];
      if (!bl.uses_topics.includes(topicPath)) bl.uses_topics.push(topicPath);
    }
  }
}

// Clean up backlinks: remove empty arrays
for (const slug of Object.keys(backlinks)) {
  const bl = backlinks[slug];
  for (const key of Object.keys(bl)) {
    if (Array.isArray(bl[key]) && bl[key].length === 0) delete bl[key];
  }
}

writeFileSync(outputFile, JSON.stringify(records, null, 2), 'utf8');
console.log(`[build-index] wrote ${records.length} records → ${outputFile}`);

writeFileSync(backlinksFile, JSON.stringify(backlinks, null, 2), 'utf8');
console.log(`[build-index] wrote ${Object.keys(backlinks).length} backlink entries → ${backlinksFile}`);
