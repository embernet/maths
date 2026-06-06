# The Mathematics Companion

A static site — built with Astro — that maps the undergraduate mathematics curriculum across four years of study. Topics include full explanations, worked examples, KaTeX-rendered mathematics, quizzes, and biographical pages for the mathematicians who shaped each field.

Created by **Mark Burnett** ([linkedin.com/in/markburnett](https://www.linkedin.com/in/markburnett)). Free to use under the [MIT licence](./LICENSE).

## Local development

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:4321`.

## Build

```bash
npm run build
```

Produces a `dist/` folder of static HTML/CSS/JS.

`npm run preview` serves the built output locally for a final check before deploy.

## Cloudflare Pages deployment

| Setting | Value |
|---------|-------|
| Framework preset | **Astro** |
| Build command | `npm run build` |
| Output directory | `dist` |
| Root directory | `apps/maths-guide` (if deploying from the monorepo) |
| Environment variables | None required |

### Deploying as a standalone repo

To lift this folder out of the monorepo and push it to its own GitHub repository for Cloudflare integration:

```bash
cp -r apps/maths-guide ~/maths-companion
cd ~/maths-companion
git init
git add .
git commit -m "Initial commit"
# Then create a new repo on GitHub and push to it.
```

Point Cloudflare Pages at the new repo. No environment variables needed; the site is fully static.

## Icons

The current PWA icons are SVG placeholders. For maximum device compatibility (especially older iOS), replace them with proper PNG files:

- `public/icons/icon-192.png` (192×192 px)
- `public/icons/icon-256.png` (256×256 px)
- `public/icons/icon-512.png` (512×512 px)
- `public/icons/favicon.ico` (optional, for legacy browsers)

Update `public/manifest.webmanifest` and the `<link>` tags in `src/layouts/BaseLayout.astro` to reference the PNG files.

## Folder structure

```
content/        — MDX topic pages and JSON configs (owned by content writers)
src/
  components/   — Astro components: Header, Footer, Sidebar, Quiz
  layouts/      — BaseLayout, TopicLayout
  pages/        — Astro routing
  scripts/      — build-index.mjs (generates public/api/index.json)
  styles/       — global.css, print.css
public/
  api/          — index.json (generated at build time; used by client-side search)
  icons/        — PWA icons (SVG placeholders)
  sw.js         — Service worker (stale-while-revalidate)
  manifest.webmanifest
```

## Stack

- [Astro 4](https://astro.build/) — static site generator
- [Tailwind CSS 3](https://tailwindcss.com/) — utility-first CSS
- [remark-math](https://github.com/remarkjs/remark-math) + [rehype-katex](https://github.com/remarkjs/remark-math/tree/main/packages/rehype-katex) — build-time LaTeX rendering
- [KaTeX](https://katex.org/) — maths display
- [Fuse.js](https://fusejs.io/) — client-side fuzzy search
- [STIX Two Text](https://fonts.google.com/specimen/STIX+Two+Text) — body and heading font

## Content guidelines

See `CONTENT_CONTRACT.md` for the full agreement between content writers and site builders: frontmatter schemas, folder layout, quiz format, and MDX conventions.
