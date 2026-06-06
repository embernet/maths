# Content Contract v1.2 — Suggested Pre-Reading, Node Taxonomy, Knowledge Graph

This appendix supplements `CONTENT_CONTRACT.md` (v1) and `CONTENT_CONTRACT_v1.1.md` (theorems, applications, navigation). Both prior contracts remain in force; v1.2 adds new fields and one new top-level feature.

## Goals of v1.2

1. Every page declares **Suggested pre-reading** — a curated, ordered list of other portal items a reader benefits from before tackling this one. Renders as a section on the page and feeds the knowledge graph.
2. Every page declares a **node_type** that determines its colour and grouping in the knowledge graph.
3. A new top-level **Knowledge Graph** view (`/graph`) lets readers explore the portal visually. Nodes are coloured by `node_type`; edges are derived from the relational frontmatter that pages already carry. The graph is generated at build time from a single `graph.json`, which is also the data source the on-page renders consume — so the on-page lists and the graph cannot drift.

## 1. New frontmatter field — `suggested_pre_reading`

Every topic page (`01-foundations` through `04-advanced-topics`), every theorem page (`93-theorems`), every application page (`94-applications`), and any other content page where pre-reading is meaningful gains this field. Mathematicians, history eras, and definitions are exempt unless the author chooses to include it.

Schema:

```yaml
suggested_pre_reading:
  - kind: topic                                                 # one of: topic | theorem | application | mathematician | history | definition | nature
    ref: 01-foundations/01-algebra-and-linear-algebra           # full slug path (or bare slug for cross-cutting kinds)
    why: "Vector spaces and matrix algebra appear throughout."  # one short line explaining the relevance
  - kind: theorem
    ref: bayes-theorem
    why: "The Bayesian framework on this page builds on Bayes' theorem."
  - kind: definition
    ref: open-set
    why: "Open sets are assumed without proof here."
```

Rules:

- The list is **ordered** by usefulness, most relevant first.
- Three to seven entries is the sweet spot. More than ten is too many; readers stop reading.
- `why:` is **mandatory** and must be one line. It is the value-add over a bare list of links.
- Do not use the word "prerequisite" in the rendered subsection — see §4 below.
- Entries pointing at content that does not yet exist are allowed; they are rendered as plain text with a "[forthcoming]" marker and become live links once the target page is created.

## 2. New frontmatter field — `node_type`

Every content page declares its node type. The build-time graph generator uses this field to colour nodes and group them in the legend.

Permitted values and their semantics:

| `node_type` | What it labels | Where it appears |
|---|---|---|
| `topic` | A curriculum thematic-area page (one of the 4 tiers) | `01-foundations/`, `02-core-mathematics/`, `03-specialist-areas/`, `04-advanced-topics/` |
| `theorem` | A theorem, identity, or named result | `93-theorems/` |
| `application` | A real-world application of mathematics | `94-applications/` |
| `mathematician` | A person who shaped the subject | `91-mathematicians/` |
| `history` | A historical era page | `90-history/` |
| `definition` | A standalone definition page | `95-definitions/` |
| `nature` | A nature/pattern page | `97-nature/` |

The `00-welcome`, `92-resources`, `98-about`, `96-lean4`, `97-python`, `98-r` pages are excluded from the graph (they are meta or programming-language pages, not graph content).

## 3. Proposed colour palette (subject to revision)

Aligned with the existing portal palette (`primary_color: #1a3a52`, `accent_color: #a77b3f`):

| `node_type` | Colour | Hex | Rationale |
|---|---|---|---|
| `topic` | Primary blue | `#1a3a52` | The core spine of the site |
| `theorem` | Accent gold | `#a77b3f` | The named results — already the accent colour |
| `application` | Olive green | `#5a7a3f` | Real-world, organic |
| `mathematician` | Plum purple | `#6a3a5e` | People, distinct from results |
| `history` | Terracotta | `#a7553f` | Warm, era-evoking |
| `definition` | Slate grey | `#5a6a7a` | Quiet, foundational |
| `nature` | Leaf green | `#3f8a5a` | Plant/biology slant |

The legend rendered on the graph view labels each colour with its `node_type` name plus a count of nodes.

## 4. Render — the "Suggested pre-reading" subsection on every topic page

Every topic page gains a subsection rendered above the page body, **with this exact heading**:

```markdown
## Suggested pre-reading
```

(Not "Prerequisites". The portal serves curious readers as well as students, and pre-reading captures useful adjacent material that a hard "prerequisite" framing would exclude.)

The subsection renders the `suggested_pre_reading` array as a short list:

> - **[Algebra and Linear Algebra](/01-foundations/01-algebra-and-linear-algebra)** — Vector spaces and matrix algebra appear throughout.
> - **[Bayes' Theorem](/theorems/bayes-theorem)** — The Bayesian framework on this page builds on Bayes' theorem.
> - **[Definition of an Open Set](/definitions/open-set)** — Open sets are assumed without proof here.

If `suggested_pre_reading` is empty or absent, the subsection is **not** rendered at all (no empty heading).

## 5. Render — the on-page "Related topics" subsection (clarified)

The existing `related:` field stays. Its rendered subsection becomes the **curated short list** appearing on the page (already established convention). It should contain **3–7** entries, chosen by the author as the most useful adjacent pages.

The knowledge graph view derives a **broader** edge set automatically from all relational frontmatter (`related`, `suggested_pre_reading`, `theorems`, `applications`, `mathematicians`, plus the inverse edges on theorem/application pages). Authors do **not** add edges to the graph manually. The on-page `related:` list and the graph view share their data sources by construction.

## 6. Knowledge graph view

A new top-level section at route `/graph` (slug `99-graph` for navigation order purposes). Built by Forge per the brief at `teams/forge/inbox/`. Specification summary:

- **Library:** Cytoscape.js (preferred layout: cose-bilkent or fcose for organic clustering)
- **Data source:** `graph.json`, generated at build time from every page's frontmatter
- **Default view:** zoomed-out, full graph; nodes coloured by `node_type`; small node labels at higher zoom only
- **Selection:** clicking a node selects it, the graph reflows/zooms gently around it and its 1-hop neighbourhood, and the right-hand side panel renders the selected page's article body (or a summary card for very long pages)
- **Side panel:** persistent on desktop (right ~40% of viewport); pop-out on mobile
- **Legend:** visible top-right, collapsible, listing each `node_type` with its colour and current node count
- **Edges:** undirected by default; styled subtly by relationship type (e.g. `related` thicker, `suggested_pre_reading` thinner, `mathematician → theorem` dotted) — final styling at Forge's discretion within the colour palette

Edge derivation rules (canonical):

- `page.related[]` → undirected edge of type `related`
- `page.suggested_pre_reading[]` → directed edge of type `pre-reading` from page → referenced item
- Topic page's `theorems[]` → edge of type `appears-in` between topic and theorem
- Topic page's `applications[]` → edge of type `applies-to` between topic and application
- Topic page's `mathematicians[]` → edge of type `attributed-to` between topic and mathematician
- Theorem page's `attributed_to[]` → edge of type `attributed-to`
- Application page's `uses_theorems[]` / `uses_topics[]` → edges of corresponding types
- Duplicate edges (same pair, any type) are deduplicated; styling reflects the strongest relationship

## 7. Standard topic-page section order (updated for v1.2)

The canonical order of subsections on every topic page is now:

1. (Frontmatter — non-rendered)
2. Page lead paragraph (after the H1)
3. **`## Suggested pre-reading`** *(new in v1.2)*
4. Main content (one or more `##` sections covering the mathematics)
5. `## Real-world applications` *(introduced in v1.1)*
6. `## Theorems on this page` *(an existing convention, where applicable)*
7. `## Related topics` *(short, curated)*
8. `## Where this leads` *(existing convention — pointers forward)*

Existing pages that lack these subsections should be brought up to standard during the v1.2 rollout.

## 8. Validation

A simple build-time check (Forge to implement) verifies:

- Every `suggested_pre_reading` entry has `kind`, `ref`, and `why`
- Every `ref` either resolves to an existing page or is in a known-forthcoming list
- Every page has a `node_type` (or is excluded from the graph per §2)
- `graph.json` is regenerated on every build

Errors fail the build with a list of the offending pages and the missing fields.

---

*v1.2 sits alongside v1 and v1.1; it does not supersede them.*
