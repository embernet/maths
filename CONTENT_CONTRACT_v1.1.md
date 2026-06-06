# Content Contract v1.1 — Theorems, Applications, Expanded Navigation

This appendix supplements `CONTENT_CONTRACT.md` with the additions for v1.1. Both agents work to this on top of the v1 contract — nothing in v1 is removed.

## Goals of v1.1

1. Every known-for item on every mathematician page becomes a clickable link to a dedicated theorem/concept page.
2. New top-level **Theorems** section indexes every theorem; each theorem page lists where it is attributed, used, and applied.
3. Every major topic page gains a **Real-world applications** subsection.
4. New top-level **Real-world applications** section indexes every application; each application page lists which theorems and topics it draws on.
5. Desktop layout gains a **left sidebar** showing the full site hierarchy (collapsible per section).
6. The **hamburger menu** carries all top sections at every viewport.

## New top-level sections

- `content/93-theorems/` — one MDX per theorem; index page at `/theorems`
- `content/94-applications/` — one MDX per real-world application; index page at `/applications`

Update `content/_site.json` `navigation_order` to:

```json
["00-welcome","01-foundations","02-core-mathematics","03-specialist-areas","04-advanced-topics","93-theorems","94-applications","90-history","91-mathematicians","92-resources"]
```

Add `_section.json` for both new sections.

## Theorem page schema — `content/93-theorems/{slug}.mdx`

```yaml
---
title: "Bayes' Theorem"
section: "Theorems"
section_slug: "93-theorems"
slug: "bayes-theorem"
attributed_to: [bayes, laplace]              # mathematician slugs — auto from slug map; can extend if work shared
era: "06-the-rigour-revolution"               # one history-era slug; pick the most relevant
appears_in: [01-foundations/04-probability-and-statistics, 02-core-mathematics/05-probability-and-statistical-inference]   # topic slugs (section/topic)
related_theorems: [conditional-probability, total-probability]
applications: [medical-diagnosis-screening, spam-filtering, machine-learning-bayesian-inference]
tags: [probability, inference, foundations]
year_introduced: "1763 (posthumous)"
summary: "How to update a probability when new evidence arrives — the engine behind modern statistical inference."
---
```

Body (~300–500 words) covers, in this order:

1. **What it says** — a clear statement, with the equation in KaTeX where relevant
2. **History** — who, when, why; one or two memorable details
3. **Why it matters** — what changes in mathematics or beyond once you have it
4. **Real-world applications** — link out to `/applications/{slug}` items (do not duplicate the application's prose here)
5. **Where you'll meet it** — link out to the topic pages and era pages that reference it

Use the canonical slug map at `content/93-theorems/_slug-map.json` for the slug, title, and attributed_to fields. Do not invent new slugs unless adding a theorem not present in the map.

## Application page schema — `content/94-applications/{slug}.mdx`

```yaml
---
title: "RSA and Public-Key Cryptography"
section: "Real-world applications"
section_slug: "94-applications"
slug: "rsa-public-key-cryptography"
domains: [computer-science, security, finance]
uses_theorems: [fermats-little-theorem, eulers-totient-function, modular-arithmetic]
uses_topics: [02-core-mathematics/01-abstract-algebra, 03-specialist-areas/01-galois-theory]
related_applications: [digital-signatures, secure-messaging, blockchain]
tags: [cryptography, security, applied]
real_world_examples: ["HTTPS / TLS on the web", "PGP email", "WhatsApp end-to-end encryption (variant)"]
summary: "Every secure website on the internet relies on a piece of seventeenth-century number theory."
---
```

Body (~300–500 words):

1. **The application** — what it is in plain language
2. **The maths behind it** — which theorems and ideas are doing the work, with KaTeX where helpful
3. **A concrete example** — specifics: numbers, scale, who uses it
4. **History of the application** — when did this become a thing, what changed
5. **Links** — to the theorem and topic pages it draws on

## Mathematician page migration — schema change

Update the `known_for` frontmatter from free-text strings to theorem **slugs**:

```yaml
# before (v1)
known_for: ["Bayes' theorem", "Bayesian probability", "Foundational paper on inverse probability"]

# after (v1.1)
known_for: [bayes-theorem, bayesian-probability, foundational-paper-on-inverse-probability]
```

Use the per-mathematician slug list at `apps/maths-guide/SLUG_MAP_MATHEMATICIANS.json` — it has the correct slug list for every existing mathematician.

The site layout will render `known_for` as a list of links to `/theorems/{slug}`, using the theorem page's title for the link text.

## Topic page additions

Every topic page (`content/0{1-4}-*/*/index.mdx`) gains:

1. New frontmatter fields:
   ```yaml
   theorems: [theorem-slugs]              # canonical slugs from _slug-map.json (plus any new ones authored)
   applications: [application-slugs]      # canonical slugs from /applications/
   ```

2. A new **`## Real-world applications`** subsection in the MDX body (placed before any history note and before the quiz). Pattern:

   > Where this turns up in the world: [GPS positioning](/applications/gps-positioning) — relativity-corrected pseudoranges depend on solving a small over-determined system, the same idea as the [least-squares regression](/theorems/least-squares) you'll meet here. [Climate models](/applications/climate-modelling) discretise the partial differential equations from this course onto enormous grids. ...

   Three to five sentences max. Link out to the application pages — don't duplicate their content.

## History-era page additions

Era pages gain `theorems:` and `applications:` frontmatter (slugs of theorems and applications most associated with that era). The layout uses these for cross-links.

## Build-index additions

`src/scripts/build-index.mjs` is extended to:

- Include theorem and application pages in `public/api/index.json` (same record shape as topic/mathematician pages, with `kind: "theorem"|"application"|"topic"|"mathematician"`)
- Emit a **second** static file `public/api/backlinks.json` keyed by canonical slug, with:
  ```json
  {
    "bayes-theorem": {
      "attributed_to": ["bayes", "laplace"],
      "appears_in_topics": ["02-core-mathematics/05-probability-and-statistical-inference"],
      "appears_in_eras": ["06-the-rigour-revolution"],
      "used_in_applications": ["medical-diagnosis-screening", "spam-filtering"]
    },
    "rsa-public-key-cryptography": {
      "uses_theorems": ["fermats-little-theorem", "eulers-totient-function"],
      "uses_topics": ["02-core-mathematics/01-abstract-algebra"]
    }
  }
  ```
- Compute backlinks two ways: (a) explicit, from frontmatter `appears_in`/`uses_topics`/etc.; (b) implicit, from MDX body links scanned for `/theorems/{slug}` and `/applications/{slug}` patterns.

## Layout additions

### Desktop left sidebar — `src/components/LeftSidebar.astro`

- Visible at `≥ 1024px` viewport, hidden below
- Shows the full hierarchy: section → topic → (children if any)
- Each section collapsible (default: current section expanded, others collapsed)
- Sticky inside its own column so it doesn't scroll out as the main content scrolls
- Current page highlighted

### Hamburger menu — extended

- Currently shown only on `< 768px`. Change to **always show on every viewport**, in the sticky header on the left of the logo, opening a full-site overlay nav.
- Overlay lists every top section in `navigation_order`, plus a "More" expand showing first-level children per section.
- Keyboard accessible: Esc closes; trap focus; restore focus on close.
- Distinct from the left sidebar — the hamburger is the *quick-access* full-site map; the sidebar is the *always-on* contextual map.

### Theorem page layout — `src/pages/theorems/[slug].astro`

Renders:

- Title, summary, year-introduced
- Body
- **Attributed to** — links to mathematician pages
- **Where it appears** — links to topic pages, era pages
- **Real-world applications** — links to application pages
- Optional **Related theorems** sidebar

### Application page layout — `src/pages/applications/[slug].astro`

Renders:

- Title, summary, domains
- Body
- **Maths behind it** — links to theorem pages
- **Topics that build it** — links to topic pages
- **Related applications** — links

### Mathematician page — updated

- "Known for" rendered as a list of links to `/theorems/{slug}`, using each theorem's title
- A "Where their work appears" footer auto-built from backlinks.json

### Topic page — updated

- "Real-world applications" subsection in body (Silas writes this)
- "Theorems on this page" sidebar built from `theorems:` frontmatter (Hephaestus renders this)

## Constraints (carry forward from v1)

- British English throughout
- No `alert()` / `confirm()` / `prompt()`
- Quizzes inline; no popups
- Frontmatter `known_for:` is now a slug list, not free text
- All new MDX bodies follow the v1 voice (warm, expert, slightly storytelling professor)
- No Bath references anywhere
- Verity's must-fixes already applied to v1 must be preserved; new content must avoid the same myths

## Out of scope for v1.1

- Comments / discussion
- Per-user progress
- Mobile collapsible left sidebar (mobile uses hamburger only; sidebar is desktop-only by design)
- Theme switcher
- Search filters by kind (will fall out naturally if users search e.g. "RSA")
