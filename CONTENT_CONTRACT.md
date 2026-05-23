# Content Contract — The Undergraduate Mathematics Companion

This file is the agreement between the **content writers** (who fill `content/`) and the **site builders** (who scaffold `src/`, build configuration, and routing). Both sides work to the schema below.

## 1. Folder layout

```
apps/maths-guide/
├── content/                          # owned by content writers
│   ├── _site.json                    # site-wide config (title, tagline, nav order)
│   ├── 00-welcome/
│   │   └── index.mdx
│   ├── 01-foundations-year-one/
│   │   ├── _section.json
│   │   ├── 01-algebra-and-linear-algebra/
│   │   │   ├── index.mdx
│   │   │   └── quiz.json
│   │   ├── 02-real-analysis-foundations/
│   │   ...
│   ├── 02-core-year-two/
│   │   ├── _section.json
│   │   ...
│   ├── 03-specialisation-year-three/
│   │   ├── _section.json
│   │   ...
│   ├── 04-advanced-topics-year-four/
│   │   ├── _section.json
│   │   ...
│   ├── 90-history/                   # Appendix A: era-based narrative
│   │   ├── _section.json
│   │   ├── 01-ancient-origins/
│   │   │   └── index.mdx
│   │   ├── 02-classical-greece/
│   │   ...
│   ├── 91-mathematicians/            # Appendix B: biographical roster
│   │   ├── _section.json
│   │   ├── archimedes.mdx
│   │   ├── cauchy.mdx
│   │   ...
│   └── 92-resources/
│       └── index.mdx                 # Appendix C: external resources
├── src/                              # owned by site builders (Astro app)
│   ├── pages/                        # routing
│   ├── layouts/                      # BaseLayout, TopicLayout, etc.
│   ├── components/                   # Quiz.astro, Search.astro, Nav.astro, …
│   ├── styles/                       # global.css with the math font stack
│   └── scripts/
│       └── build-index.mjs           # walks content/, produces public/api/index.json
├── public/                           # static assets
│   ├── manifest.webmanifest          # PWA manifest
│   ├── sw.js                         # service worker (offline cache)
│   └── icons/                        # PWA icons
├── astro.config.mjs                  # static output; KaTeX + remark-math
├── tailwind.config.mjs               # if Tailwind is used
├── package.json
├── README.md                         # build & deploy instructions
└── .gitignore
```

## 2. Frontmatter — topic pages (`index.mdx`)

```yaml
---
title: "Sequences, Limits and the ε–δ Definition"
section: "Foundations: Year One"
section_slug: "01-foundations-year-one"
year: 1
order: 2
tags: [analysis, sequences, limits, foundations, epsilon-delta]
prerequisites: []                    # slugs of prerequisite topics
related: [02-continuity, 03-convergence-tests, 04-series]   # slugs
mathematicians: [bolzano, cauchy, weierstrass, archimedes]   # slugs (link to Appendix B)
reading_time_min: 12
summary: "What it really means for a sequence to converge, and the rigorous ε–δ language analysis uses to pin it down."
---
```

## 3. Frontmatter — mathematician pages (Appendix B, e.g. `cauchy.mdx`)

```yaml
---
title: "Augustin-Louis Cauchy"
section: "Mathematicians"
section_slug: "91-mathematicians"
slug: cauchy
born: "1789-08-21"
died: "1857-05-23"
origin: "Paris, France"
worked_in: ["France", "Italy", "Czech lands"]
known_for: ["Cauchy sequences", "Cauchy's integral theorem", "Cauchy–Schwarz inequality", "Cauchy–Riemann equations"]
appears_in: [analysis-foundations, complex-analysis, ode-theory]   # topic slugs
tags: [analysis, complex-analysis, foundations]
hook: "Wrote over 800 papers; was a devout Catholic royalist who voluntarily exiled himself when France's king fell, taking a chair in Turin rather than swear allegiance to the new regime."
---
```

## 4. Frontmatter — history era pages (Appendix A)

```yaml
---
title: "Era 6 — The Rigour Revolution"
section: "A Brief History of Mathematics"
section_slug: "90-history"
era_number: 6
period: "c.1810–1900"
order: 6
key_figures: [bolzano, cauchy, weierstrass, dedekind, cantor, riemann]
key_developments: ["ε–δ definitions", "construction of the real numbers", "set-theoretic foundations", "infinity made precise"]
related_topics: [analysis-foundations, real-analysis, set-theory]
summary: "After two centuries of brilliant but informal calculus, nineteenth-century analysts forced mathematics onto solid logical foundations — and discovered, in the process, that infinity comes in different sizes."
---
```

## 5. Section index — `_section.json`

```json
{
  "title": "Foundations: Year One",
  "slug": "01-foundations-year-one",
  "order": 1,
  "blurb": "The four pillars of a maths degree: algebra, analysis, probability, and the methods that connect them to the world.",
  "icon": "year-1"
}
```

## 6. Site config — `content/_site.json`

```json
{
  "title": "The Undergraduate Mathematics Companion",
  "tagline": "A friendly map of the curriculum a maths undergraduate meets in their first four years.",
  "author_credit": "Compiled by a mathematics professor for any student arriving with strong A-Level mathematics.",
  "theme": {
    "body_font": "STIX Two Text, Latin Modern Roman, Georgia, serif",
    "heading_font": "STIX Two Text, Latin Modern Roman, Georgia, serif",
    "math_font": "KaTeX defaults (Computer Modern)",
    "primary_color": "#1a3a52",
    "accent_color": "#a77b3f"
  },
  "navigation_order": [
    "00-welcome",
    "01-foundations-year-one",
    "02-core-year-two",
    "03-specialisation-year-three",
    "04-advanced-topics-year-four",
    "90-history",
    "91-mathematicians",
    "92-resources"
  ],
  "github_repo": null,
  "cloudflare_pages_project": null
}
```

## 7. Quiz format — `quiz.json` (one per topic page)

```json
{
  "topic_slug": "01-sequences-limits-epsilon-delta",
  "title": "Check your understanding",
  "questions": [
    {
      "id": "q1",
      "stem": "Which of the following is the correct ε–δ definition of $\\lim_{x \\to a} f(x) = L$?",
      "options": [
        {"id": "a", "text": "For every ε > 0 there exists δ > 0 such that $|f(x) - L| < \\varepsilon$ whenever $0 < |x - a| < \\delta$.", "correct": true,  "explanation": "This is exactly Cauchy's formal definition — first ε is challenged, then δ is produced in response."},
        {"id": "b", "text": "For every δ > 0 there exists ε > 0 such that $|x - a| < \\delta$ whenever $|f(x) - L| < \\varepsilon$.", "correct": false, "explanation": "The quantifiers are swapped — this would let f(x) be anything you like near a."},
        {"id": "c", "text": "$f(a) = L$.", "correct": false, "explanation": "f doesn't even need to be defined at a — the limit talks about the *approach*, not the value."},
        {"id": "d", "text": "$|f(x) - L|$ tends to zero.", "correct": false, "explanation": "True but circular — this defines the limit using another limit. The ε–δ form makes 'tends to' itself precise."}
      ]
    }
  ]
}
```

- Equations use LaTeX inside `$...$` (inline) or `$$...$$` (display). KaTeX renders them.
- 3–5 questions per quiz.
- Exactly one `correct: true` per question. (Multiple-correct is out of scope for v1.)
- Every option carries an explanation, shown after the user answers.

## 8. MDX page body conventions

- **No "this section will cover…" narration.** The page IS the content. Open with the idea, not a meta-description of the idea. (See [[feedback_documents_stand_alone]].)
- **Maths in LaTeX:** inline `$\\varepsilon > 0$`, display `$$\\int_0^1 f(x)\\,dx.$$`
- **Cross-link mathematicians** with relative links: `[Cauchy](/mathematicians/cauchy)`.
- **Cross-link topics** with relative links: `[Continuity](/foundations-year-one/03-continuity)`.
- **Sections within a topic page** — typical structure:
  1. Opening framing paragraph
  2. Definition / key idea, with maths
  3. A worked example or intuition pump
  4. Why it matters / real-world application
  5. Historical note (who, when, why it was developed)
  6. *(Quiz auto-inserted by site builder — author does not include it in the MDX body)*
- **Voice:** warm, expert, addressing the reader as "you" (the undergraduate). Slightly storytelling. Never patronising.
- **British English** throughout.

## 9. Site-builder responsibilities (Astro app)

- **Routing:** `/` → welcome; `/{section_slug}` → section index page (built from `_section.json` + child page summaries); `/{section_slug}/{topic_slug}` → topic page (built from MDX); `/mathematicians/{slug}` → individual mathematician page; `/resources` → resources page.
- **Layout:** sticky top header (logo + section nav + search). Mobile: hamburger nav. Desktop: full nav.
- **Mobile:** content fills viewport, no horizontal scroll, body-text size 18px minimum.
- **PWA:** installable, offline-capable (service worker caches all static pages + KaTeX CSS).
- **No native popups:** quizzes reveal answers inline; modals (if any) are custom DOM, not `alert()`/`confirm()`/`prompt()`.
- **Quiz component:** loaded as an Astro island. Reads colocated `quiz.json`. Each question is presented; user selects; on submit, correct/incorrect indicator + explanation reveal. End-of-quiz score.
- **Build-time index** (`public/api/index.json`): array of `{ title, section, slug, summary, tags, mathematicians }` for every topic + mathematician page. The browser fetches this once for client-side search.
- **Search:** client-side, Fuse.js, fuzzy across title/summary/tags. Available in the sticky header.
- **Cross-links:** computed at build time from `related:` and `mathematicians:` frontmatter; rendered as a sidebar or footer on each topic page.
- **Print stylesheet:** strip nav/quiz/search; topic body prints cleanly.

## 10. Build & deploy

- `npm install` then `npm run build` produces `dist/` — a folder of static HTML/CSS/JS.
- Cloudflare Pages deploy: project root = `apps/maths-guide/`, build command = `npm run build`, output dir = `dist/`. No environment variables required.
- The folder is structured so it can be lifted (`cp -r apps/maths-guide /tmp/maths-companion && cd /tmp/maths-companion && git init`) and pushed to its own GitHub repo for the Cloudflare integration.

## 11. Out of scope for v1

- User accounts, progress tracking, server-side anything.
- LaTeX/PDF export of pages.
- Authoring UI — content is markdown files, edited in any editor.
- Multiple-correct or numeric-input quizzes.
- Embedded figures generated from code (Plotly etc.). v1 uses prose + KaTeX equations only.
