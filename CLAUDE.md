# Mathematics Companion — project guide

A static, content-rich **companion to mathematics for anyone** — professionals using
maths at work, hobbyists, students, and the simply curious. **Not** "for university
students". Built with **Astro 4** (MDX content) and deployed to **Cloudflare Workers**
under the sub-path **`tapestrylab.net/maths`**.

**Mission: expand minds.** Link mathematics to innovation, real-world problem-solving,
history, biology, other fields, and genuinely cool ideas — don't just restate theorems.

## Commands

- `npm run build` — full build. Wraps `astro build` in a retry (`tools/build-with-retry.mjs`)
  for a known flaky Astro 4 SSR-chunking race, and first regenerates the search/graph
  index via `src/scripts/build-index.mjs` (prebuild).
- `npm run dev` — Astro dev server. ⚠️ In dev, author-written absolute links are **not**
  base-rewritten (that happens at build), so use the built site for an accurate preview.
- Preview the real built site: `npx wrangler dev --local` (serves at `/maths`), or run a
  static server over `dist/` (e.g. `cd dist && python3 -m http.server 8790` → `/maths/`).

## Architecture (the bits that bite)

- **Content** is MDX in `content/`, grouped by section (`01-foundations` … `04-advanced-topics`,
  `90-history`, `91-mathematicians`, `93-theorems`, `94-applications`, `95-definitions`,
  `96-lean4`, `97-python`, `97-nature`, `98-r`, `98-about`, `00-welcome`). Each section has a
  `_section.json` (title, blurb, icon). Register new sections in `content/_site.json`
  (`navigation_order`).
- `src/scripts/build-index.mjs` generates `public/api/index.json` (search), `backlinks.json`,
  and `graph.json` (knowledge graph). The glossary (`95-definitions`) **is** indexed for search.
- **Sub-path deploy**: `base: '/maths'`. Astro only prefixes its own assets;
  `src/lib/integration-base-path.mjs` rewrites all author-written root-absolute links to
  `/maths/…` at build and emits `sitemap.xml`. **Write internal links root-absolute**
  (`/theorems/foo`) — the integration adds the base. Client `fetch`/script paths must use
  `window.__BASE__` (set in `BaseLayout`).
- **Math**: body math is `$…$` / `$$…$$` (remark-math + rehype-katex). Titles shown in index
  lists must be rendered with `renderTitleMath()` from `src/lib/render-title-math.mjs`
  (never print a raw `$…$` title). KaTeX CSS is loaded globally in `BaseLayout`.
- **Do NOT set Astro `site`** — it triggers the flaky chunking bug. Absolute URLs come from
  `SITE_ORIGIN` in `src/lib/site-config.mjs`.
- **Icons/branding** are generated from `brand/logo-master.png` via `tools/generate-icons.mjs`.

## Engineering principles — see `docs/ENGINEERING_GUIDE.md`

Follow SOLID, DRY, and separation of concerns. **Never copy a helper into a
second file** — share it: build-time logic in `src/lib/*.mjs` (import it, e.g.
`tagSlug`); client-side logic as a `window.mc*` API defined once in a component
in `BaseLayout` (`window.mcDialog`, `window.mcBookmarks`, `window.mcUtil`). All
`<script is:inline>` blocks share the page scope, so helper names and element ids
must be unique/prefixed (two `normalize()` in one scope silently broke search).
Keep data/model, rendering, and event wiring separate; test interactive client
code in a headless DOM (`linkedom`) before shipping.

## UI conventions

- **Never use the browser's `alert()` / `confirm()` / `prompt()`** (or any native
  dialog). Every window must be surfaced *by the app* so it matches the site's
  look and behaviour. Use the in-app equivalents from `src/components/Dialog.astro`
  (included once in `BaseLayout`), available globally as promise-based calls:
  `window.mcDialog.alert(msg, opts)`, `.confirm(msg, opts)` → `Promise<boolean>`,
  `.prompt(msg, opts)` → `Promise<string|null>` (opts: `title, okText, cancelText,
  placeholder, defaultValue`). They are modal, focus-trapped, Esc=cancel,
  Enter=OK, restore focus, and serialise. Because they're async, rewrite
  synchronous `if (confirm(...))` patterns into `.then(ok => { ... })`.

## Writing & content principles — see `docs/WRITING_GUIDE.md`

1. **Broad audience.** No "your degree / at A-level / in lectures" framing. The curriculum
   arc is a *structure*, explained once on the About page — never reiterated as the audience.
2. **Explain every term the first time it is used** — or make sure it has a glossary entry in
   `content/95-definitions/`. Prefer explanations that also give the **why / story / history**
   when that aids memory or delight. Example: *duck typing* isn't just "structural typing" —
   say *why* it's called that ("if it walks like a duck and quacks like a duck, it's a duck").
3. **Expand minds.** Draw in innovation, applications, adjacent fields, and the human story.
4. **Always render math/markdown.** Never ship raw `$…$`, backticks, or stray markdown.

## Visuals & simulations

- **Raster images / illustrations → use the `agy` CLI** (Google image generation), e.g.
  `agy -p "<detailed brief; SAVE a PNG to <abs path>>" --dangerously-skip-permissions --add-dir <dir>`.
  It is agentic and can take a few minutes — run it in the background and verify the output
  file exists with the right dimensions before using it.
- You can also hand-author **SVG / vector graphics** and build **interactive JavaScript
  simulations** (SVG/canvas/WebGL), importing libraries like **D3** as needed to bring ideas
  to life. Vendor libraries locally (`public/vendor/`) — the site is self-contained and
  offline-capable (service worker), so do not rely on external CDNs at runtime.

## Agents — in `.claude/agents/` (auto-discovered)

- `content-reviewer` — verifies terms are explained (understanding / entertainment / history)
  and that all LaTeX/markdown renders.
- `visualisation` — designs & builds visualisations and interactive simulations.
- `ux-design` — UX, information architecture, interaction design.
- `usability-reviewer` — can a non-expert follow it, and does it delight?
- `writer` — drafts content in the house voice.
