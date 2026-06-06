/**
 * build-index.mjs
 *
 * Walks content/, reads frontmatter from every page MDX,
 * and writes:
 *   public/api/index.json    — Fuse.js search index (all pages)
 *   public/api/backlinks.json — cross-link map keyed by canonical slug
 *   public/api/graph.json    — knowledge graph (nodes + edges) for the /graph view
 *
 * Each search record:
 * { title, section, slug, kind, summary, tags, mathematicians, url }
 *
 * Run automatically via `prebuild` in package.json.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..', '..');
const contentDir = join(root, 'content');
const outputDir = join(root, 'public', 'api');
const outputFile = join(outputDir, 'index.json');
const backlinksFile = join(outputDir, 'backlinks.json');
const graphFile = join(outputDir, 'graph.json');

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

/** Extract YAML frontmatter from an MDX/MD file using js-yaml. Returns object or null. */
function parseFrontmatter(filePath) {
  let text;
  try { text = readFileSync(filePath, 'utf8'); } catch { return null; }

  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;

  const yamlBlock = text.slice(3, end).trim();
  try {
    const parsed = yaml.load(yamlBlock);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // Fall back to simple line-by-line parser for resilience
  }

  // Simple line-by-line fallback (flat key-value only)
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

// Graph data: collected in parallel with the main walk
// pageData: keyed by node id; stores frontmatter for edge derivation
const pageData = new Map(); // nodeId -> { fm, url, title, node_type, forthcoming: false }

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

// ── Sections excluded from the graph ──────────────────────────────────────────
const GRAPH_EXCLUDED = new Set([
  '00-welcome', '92-resources', '98-about', '96-lean4', '97-python', '98-r',
]);

// Infer node_type from directory prefix when not declared in frontmatter
function inferNodeType(dirEntry) {
  if (dirEntry.startsWith('01-') || dirEntry.startsWith('02-') ||
      dirEntry.startsWith('03-') || dirEntry.startsWith('04-')) return 'topic';
  if (dirEntry === '91-mathematicians') return 'mathematician';
  if (dirEntry === '93-theorems')       return 'theorem';
  if (dirEntry === '94-applications')   return 'application';
  if (dirEntry === '90-history')        return 'history';
  if (dirEntry === '97-nature')         return 'nature';
  if (dirEntry === '95-definitions')    return 'definition';
  return null;
}

if (!existsSync(contentDir)) {
  writeFileSync(outputFile, '[]', 'utf8');
  writeFileSync(backlinksFile, '{}', 'utf8');
  writeFileSync(graphFile, JSON.stringify({ nodes: [], edges: [] }, null, 2), 'utf8');
  console.log('[build-index] content/ not found — wrote empty outputs');
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

      const url = `/mathematicians/${slug}`;
      records.push({
        title: fm.title,
        section: 'Mathematicians',
        slug,
        kind: 'mathematician',
        summary: fm.hook ?? fm.summary ?? '',
        tags: fm.tags ?? [],
        mathematicians: [],
        url,
      });

      const nodeId = `mathematician:${slug}`;
      pageData.set(nodeId, {
        fm,
        url,
        title: fm.title,
        node_type: 'mathematician',
        summary: fm.hook ?? fm.summary ?? '',
        forthcoming: false,
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
      const url = `/90-history/${sub}`;
      records.push({
        title: fm.title,
        section: 'A Brief History of Mathematics',
        slug,
        kind: 'era',
        summary: fm.summary ?? '',
        tags: fm.tags ?? [],
        mathematicians: fm.key_figures ?? [],
        url,
      });

      const nodeId = `history:${sub}`;
      pageData.set(nodeId, {
        fm,
        url,
        title: fm.title,
        node_type: fm.node_type ?? 'history',
        summary: fm.summary ?? '',
        forthcoming: false,
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

  // ---------- Nature section (97-nature) ----------
  if (entry === '97-nature') {
    for (const sub of readdirSync(entryPath)) {
      const subPath = join(entryPath, sub);
      if (!statSync(subPath).isDirectory()) continue;
      const filePath = join(subPath, 'index.mdx');
      const fm = parseFrontmatter(filePath);
      if (!fm || !fm.title) continue;
      const slug = sub.replace(/^\d+-/, '');
      const url = `/97-nature/${sub}`;

      const nodeId = `nature:${sub}`;
      pageData.set(nodeId, {
        fm,
        url,
        title: fm.title,
        node_type: fm.node_type ?? 'nature',
        summary: fm.summary ?? '',
        forthcoming: false,
      });
    }
    continue;
  }

  // ---------- Definitions (95-definitions) ----------
  if (entry === '95-definitions') {
    for (const file of readdirSync(entryPath)) {
      if (extname(file) !== '.mdx') continue;
      const slug = basename(file, '.mdx');
      if (slug === 'index' || slug.startsWith('_')) continue;
      const fm = parseFrontmatter(join(entryPath, file));
      if (!fm || !fm.title) continue;
      const url = `/definitions/${slug}`;

      const nodeId = `definition:${slug}`;
      pageData.set(nodeId, {
        fm,
        url,
        title: fm.title,
        node_type: fm.node_type ?? 'definition',
        summary: fm.summary ?? '',
        forthcoming: false,
      });
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
      const url = `/theorems/${slug}`;

      records.push({
        title,
        section: 'Theorems',
        slug,
        kind: 'theorem',
        summary: fm.summary ?? '',
        tags: fm.tags ?? [],
        mathematicians: fm.attributed_to ?? [],
        url,
      });

      const nodeId = `theorem:${slug}`;
      pageData.set(nodeId, {
        fm,
        url,
        title,
        node_type: fm.node_type ?? 'theorem',
        summary: fm.summary ?? '',
        forthcoming: false,
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
      for (const aSlug of appLinks) {
        if (!bl.used_in_applications.includes(aSlug)) bl.used_in_applications.push(aSlug);
      }
    }

    // Add slug-map stubs not already in MDX (forthcoming theorems)
    for (const [slug, entry2] of Object.entries(slugMap)) {
      if (foundSlugs.has(slug)) continue;
      const title = entry2.title ?? slug;
      const url = `/theorems/${slug}`;
      records.push({
        title,
        section: 'Theorems',
        slug,
        kind: 'theorem',
        summary: '',
        tags: [],
        mathematicians: entry2.attributed_to ?? [],
        url,
      });
      const nodeId = `theorem:${slug}`;
      pageData.set(nodeId, {
        fm: { attributed_to: entry2.attributed_to ?? [] },
        url,
        title,
        node_type: 'theorem',
        summary: '',
        forthcoming: true, // slug-map stubs are forthcoming
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
      const url = `/applications/${slug}`;

      records.push({
        title,
        section: 'Real-world applications',
        slug,
        kind: 'application',
        summary: fm.summary ?? '',
        tags: fm.tags ?? [],
        mathematicians: [],
        url,
      });

      const nodeId = `application:${slug}`;
      pageData.set(nodeId, {
        fm,
        url,
        title,
        node_type: fm.node_type ?? 'application',
        summary: fm.summary ?? '',
        forthcoming: false,
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

  // ---------- Excluded meta/programming sections ----------
  if (GRAPH_EXCLUDED.has(entry)) continue;

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
    const url = `/${entry}/${sub}`;

    records.push({
      title: fm.title,
      section: sectionTitle,
      slug: topicSlug,
      kind: 'topic',
      summary: fm.summary ?? '',
      tags: fm.tags ?? [],
      mathematicians: fm.mathematicians ?? [],
      url,
    });

    const nodeId = `topic:${topicPath}`;
    pageData.set(nodeId, {
      fm,
      url,
      title: fm.title,
      node_type: fm.node_type ?? 'topic',
      summary: fm.summary ?? '',
      forthcoming: false,
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

// ── Graph generation ───────────────────────────────────────────────────────────

// Helper: resolve a ref + kind to a node id
function refToNodeId(kind, ref) {
  switch (kind) {
    case 'topic':        return `topic:${ref}`;
    case 'theorem':      return `theorem:${ref}`;
    case 'application':  return `application:${ref}`;
    case 'mathematician': return `mathematician:${ref}`;
    case 'history':      return `history:${ref}`;
    case 'definition':   return `definition:${ref}`;
    case 'nature':       return `nature:${ref}`;
    default:             return `${kind}:${ref}`;
  }
}

// Ensure a node exists; if not, create a forthcoming stub
function ensureNode(id, kind, ref, nodesMap) {
  if (!nodesMap.has(id)) {
    const label = ref.split('/').pop().replace(/^\d+-/, '').replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    nodesMap.set(id, {
      id,
      label,
      node_type: kind,
      url: null,
      summary: '',
      forthcoming: true,
    });
  }
  return nodesMap.get(id);
}

// Build nodes map from pageData
const nodesMap = new Map();
for (const [id, data] of pageData) {
  nodesMap.set(id, {
    id,
    label: data.title,
    node_type: data.node_type,
    url: data.url,
    summary: data.summary,
    forthcoming: data.forthcoming,
  });
}

// Build edges with deduplication
const edgeSet = new Set(); // serialised "{source}|{target}|{type}"
const edges = [];

function addEdge(source, target, type) {
  const key = `${source}|${target}|${type}`;
  if (edgeSet.has(key)) return;
  edgeSet.add(key);
  edges.push({ source, target, type });
}

// Validation error collection
const validationErrors = [];
const validationWarnings = [];

for (const [nodeId, data] of pageData) {
  const fm = data.fm;

  // Warn on missing node_type for graph-relevant pages
  if (!fm.node_type && !data.forthcoming) {
    validationWarnings.push(`${nodeId}: missing node_type field (inferred as ${data.node_type})`);
  }

  // page.related[] → undirected edge (type: "related")
  const related = Array.isArray(fm.related) ? fm.related : [];
  for (const relRef of related) {
    // related entries on topic pages are sibling topic slugs in the same section
    // We try to match them to existing topic nodes
    let relId = null;
    for (const [eid] of pageData) {
      if (eid.endsWith(`/${relRef}`) || eid === `topic:${relRef}`) {
        relId = eid;
        break;
      }
    }
    if (relId) {
      addEdge(nodeId, relId, 'related');
    }
  }

  // suggested_pre_reading → directed edges (type: "pre-reading")
  const spr = Array.isArray(fm.suggested_pre_reading) ? fm.suggested_pre_reading : [];
  for (const entry of spr) {
    // Validate entry structure
    if (!entry.kind || !entry.ref || !entry.why) {
      validationErrors.push(
        `${data.url ?? nodeId}: suggested_pre_reading entry missing required field(s) — ` +
        `kind=${entry.kind}, ref=${entry.ref}, why=${entry.why}`
      );
      continue;
    }
    const targetId = refToNodeId(entry.kind, entry.ref);
    ensureNode(targetId, entry.kind, entry.ref, nodesMap);
    addEdge(nodeId, targetId, 'pre-reading');
  }

  // Topic: theorems[] → "appears-in"
  if (data.node_type === 'topic') {
    for (const tSlug of fm.theorems ?? []) {
      const targetId = `theorem:${tSlug}`;
      ensureNode(targetId, 'theorem', tSlug, nodesMap);
      addEdge(nodeId, targetId, 'appears-in');
    }
    // Topic: applications[] → "applies-to"
    for (const aSlug of fm.applications ?? []) {
      const targetId = `application:${aSlug}`;
      ensureNode(targetId, 'application', aSlug, nodesMap);
      addEdge(nodeId, targetId, 'applies-to');
    }
    // Topic: mathematicians[] → "attributed-to"
    for (const mSlug of fm.mathematicians ?? []) {
      const targetId = `mathematician:${mSlug}`;
      ensureNode(targetId, 'mathematician', mSlug, nodesMap);
      addEdge(nodeId, targetId, 'attributed-to');
    }
  }

  // Theorem: attributed_to[] → "attributed-to"
  if (data.node_type === 'theorem') {
    for (const mSlug of fm.attributed_to ?? []) {
      const targetId = `mathematician:${mSlug}`;
      ensureNode(targetId, 'mathematician', mSlug, nodesMap);
      addEdge(nodeId, targetId, 'attributed-to');
    }
  }

  // Application: uses_theorems[] → "uses-theorem", uses_topics[] → "uses-topic"
  if (data.node_type === 'application') {
    for (const tSlug of fm.uses_theorems ?? []) {
      const targetId = `theorem:${tSlug}`;
      ensureNode(targetId, 'theorem', tSlug, nodesMap);
      addEdge(nodeId, targetId, 'uses-theorem');
    }
    for (const topRef of fm.uses_topics ?? []) {
      const targetId = `topic:${topRef}`;
      ensureNode(targetId, 'topic', topRef, nodesMap);
      addEdge(nodeId, targetId, 'uses-topic');
    }
  }
}

const nodes = Array.from(nodesMap.values());

// Summary counts
const typeCounts = {};
for (const n of nodes) {
  typeCounts[n.node_type] = (typeCounts[n.node_type] ?? 0) + 1;
}
const typeCountStr = Object.entries(typeCounts)
  .map(([k, v]) => `${v} ${k}s`)
  .join(', ');

writeFileSync(graphFile, JSON.stringify({ nodes, edges }, null, 2), 'utf8');
console.log(`[build-index] graph.json: ${nodes.length} nodes (${typeCountStr}), ${edges.length} edges`);

// ── Validation gate ────────────────────────────────────────────────────────────

if (validationWarnings.length > 0) {
  console.warn(`[build-index] ${validationWarnings.length} node_type warning(s):`);
  for (const w of validationWarnings) console.warn(`  WARN  ${w}`);
}

if (validationErrors.length > 0) {
  console.error(`[build-index] ${validationErrors.length} validation error(s):`);
  for (const e of validationErrors) console.error(`  ERROR ${e}`);
  process.exit(1);
}
