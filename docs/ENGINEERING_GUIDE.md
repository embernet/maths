# Engineering Guide — Mathematics Companion

House rules for anyone writing code here (humans and agents). The goal is a
codebase where a change in one place can't silently break something unrelated —
like the search/bookmarks `normalize()` collision that these rules exist to
prevent.

## SOLID, in this codebase

- **Single responsibility.** A component, module, or function does one job. Do
  **not** put two unrelated concerns in one scope — e.g. search logic and
  bookmark logic must not live in the same `<script>` IIFE. If a file is growing
  a second responsibility, split it.
- **Open/closed.** Extend behaviour by adding small, focused modules/components,
  not by bolting more branches into an already-large function.
- **Liskov / interface segregation.** Keep shared helpers' contracts narrow and
  stable; callers should depend only on what they use.
- **Dependency inversion.** Depend on a shared abstraction (a `src/lib` helper or
  a `window.mc*` API), not on a copy-pasted implementation.

## DRY — one source of truth

**Never copy a helper into a second file.** If two places need the same logic,
extract it once and import/use it:

- **Build-time / SSR code** (`.astro` frontmatter, `.mjs` scripts): put shared
  logic in `src/lib/*.mjs` and `import` it. Model to follow: `src/lib/tag-slug.mjs`
  (`tagSlug`) used by every tag pill and the tag routes, and `src/lib/site-config.mjs`.
- **Client-side code** (`<script is:inline>`): you can't `import` modules there,
  so expose shared state/utilities **once** as a `window.mc*` API from a component
  included in `BaseLayout`, and call it from every page. Established examples:
  - `window.mcDialog` — in-app alert/confirm/prompt (`src/components/Dialog.astro`).
  - `window.mcBookmarks` — the bookmarks store/model (`src/components/BookmarksStore.astro`).
  - `window.mcUtil` — small shared client utilities (e.g. `escapeHtml`).

If you find yourself writing `function escapeHtml`, `function normalize`, a
localStorage read/write, or a slugifier for the second time — stop and reuse the
shared one.

## Separation of concerns

Keep **data/model**, **rendering**, and **event wiring** distinct. The bookmarks
store (`window.mcBookmarks`) owns the data model and persistence; pages only
render it and wire events. A UI component should not re-implement the model.

## The `<script is:inline>` scope hazard (why the guides exist)

All inline scripts on a page share the page's global scope through `window` and
the DOM id namespace. Two pitfalls:

1. **Within one IIFE, a helper name must have exactly one meaning.** Two
   `function normalize(...)` declarations in the same scope → the later hoists
   over the earlier, silently. This broke search. Prefer calling a shared
   `window.mc*` API over declaring local helpers; if you must declare one,
   namespace it (`bmNormalize`, `searchNormalize`).
2. **Element ids are global.** Use unique, prefixed ids (`bm-…`, `mc-dialog-…`,
   `gol-…`). Don't reuse an id across components that can appear on one page.

## Testing client behaviour

Interactive `is:inline` code isn't exercised by the build. Before shipping
non-trivial client logic, drive it in a headless DOM (`linkedom`) — load the
built page, stub `localStorage`/`fetch`, dispatch the events, and assert the
result. This is how the search regression was caught and verified.

Gotcha when simulating **multiple page loads** in one Node process: linkedom's
`window` proxies property writes to `globalThis`, so `window.mc*` globals leak
from one simulated page into the next and the stores' `if (window.mcX) return;`
guards skip re-initialisation (which a real browser never does). Delete the
`mc*`/`__BASE__` keys from `globalThis` between loads.

## Checklist before committing code

- [ ] No helper/function duplicated from another file (grep the name).
- [ ] Shared client logic goes through a `window.mc*` API, not a local copy.
- [ ] One responsibility per component/script scope.
- [ ] Ids and shared global names are unique and prefixed.
- [ ] Non-trivial client interaction has a headless-DOM check.
