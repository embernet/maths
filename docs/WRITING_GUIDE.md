# Writing Guide — Mathematics Companion

This is the house style for all content. The content agents (`writer`,
`content-reviewer`, `usability-reviewer`) must follow and enforce it.

## Who we write for

**Anyone who meets these ideas** — someone using maths at work, a hobbyist, a student,
or a curious reader. Assume only school-level maths as a floor, then build. **Never**
assume the reader is a university student. Avoid "your degree", "at A-level", "in
lectures", "before term", "first year". The material happens to follow the arc of a
typical undergraduate curriculum because that order works — this is explained **once**
on the About page and never reiterated as the audience.

## The mission: expand minds

Every page should leave the reader with more than a definition. Connect the idea to:
- **why it matters** and what it unlocks;
- **real-world uses** and current problems it helps solve;
- **adjacent fields** (physics, biology, computing, art, finance, climate…);
- **the human story** — who, when, what fight or accident produced it.

We are not here to regurgitate theorems. We are here to make people think *"I didn't
know maths touched that."*

## The term-explanation rule (required)

**Every technical term is explained the first time it appears on a page, or has a
glossary entry** in `content/95-definitions/` that the term links to (bold terms
auto-link to definitions). A page must never leave a key term unexplained.

Prefer explanations that also carry the **why / story / history** when that aids
understanding, memory, or delight:

> **Good.** "Python uses **duck typing**: it doesn't check an object's declared type,
> only whether it supports the operation you ask of it. The name comes from the saying
> *'if it walks like a duck and quacks like a duck, it's a duck'* — if an object quacks
> (has the method), Python treats it as a duck."
>
> **Not enough.** "Python uses duck typing, a form of structural typing."

The etymology/story is not decoration — it embeds the idea and makes it stick.

## Voice

Warm, precise, a little storytelling, never patronising. Short sentences for hard ideas.
Address the reader as "you" where natural, but as a *fellow explorer*, not a pupil.

## Math & markdown must render

- Body math: inline `$…$`, display `$$…$$` (remark-math + rehype-katex).
- Titles/labels shown in index lists must be passed through `renderTitleMath()`
  (`src/lib/render-title-math.mjs`) — never print a raw `$\varepsilon$`.
- Before shipping, **view the built page** and confirm no raw `$…$`, backticks, or stray
  markdown is visible. This is a review checklist item.

## Visuals & interactivity

Bring ideas to life. Options, in order of preference for the job:
1. **Interactive simulation** (SVG/canvas/JS, D3 where it helps) — best for dynamic ideas
   (chaos, diffusion, gradient descent, cellular automata, N-body, etc.). Vendor libs
   locally in `public/vendor/`.
2. **Hand-authored SVG / vector diagrams** — crisp, themeable, tiny.
3. **Raster illustration via `agy`** (Google image generation) — for richer artwork.
   Give a detailed brief and save a PNG; verify dimensions.

Label axes, provide a one-line "what am I looking at", respect light/dark, and make it
keyboard- and touch-usable.

## Front-matter checklist for a new content page

- `title`, `summary` (one sentence), `tags`, and section-appropriate fields.
- A real-world applications angle and at least one cross-link to a related page.
- Any new key terms either explained inline or added to `95-definitions/`.
