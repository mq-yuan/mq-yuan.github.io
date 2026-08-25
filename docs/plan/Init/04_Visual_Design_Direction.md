# 04 — Visual Design Direction

> The executable visual system: typography, spacing, layout, color, and component
> treatments. Target character: **editorial · minimal · technical · experimental** —
> a quiet, serif-led reading surface with a mono "instrument panel" layer for
> metadata, and one WebGL signature visual (doc 05) as the only loud element.
> All values here are the Phase 2 starting point; refinements during implementation
> must be written back into this file.

## 1. Typography

### Font roles

| Role | Font | Fallbacks | Usage |
| --- | --- | --- | --- |
| Body / prose | **Libertinus Serif** | TeX Gyre Termes, Times New Roman, Georgia, serif | Article text, long-form reading, about |
| Display / headings | Libertinus Serif (weight/size contrast, optional italic) | same | H1–H3, hero name |
| Meta / technical | **A monospace** (candidate: JetBrains Mono or Commit Mono; final pick in Phase 2) | ui-monospace, SFMono-Regular, monospace | Dates, venues, tags, nav labels, reading time, BibTeX, code |

Rationale: serif body is the differentiation vector against the sans-default academic
web (doc 02); Libertinus matches the author's established taste in scientific
figures, creating continuity between papers and website. Mono metadata is the
"technical" signature. No third family; sans-serif appears only in system fallbacks.

### Loading

- Self-hosted subsetted `woff2` via **Astro Fonts API** (Astro 6+) or manual
  `@font-face` with `font-display: swap` + preload of the two critical files
  (serif regular, mono regular). Budget: ≤ 4 font files critical path
  (serif regular/italic/bold + mono regular); total webfont transfer ≤ 300KB.
- Libertinus Serif license: SIL OFL 1.1 — self-hosting permitted.

### Scale

Fluid type via `clamp()`, anchored at 1rem = 16px, ratio ≈ 1.25 (major third):

```text
--text-xs:   0.75rem   (12px)  fine meta, footnotes labels
--text-sm:   0.875rem  (14px)  meta row, tags, captions
--text-base: 1.0625rem (17px)  UI text, list descriptions
--text-md:   1.1875rem (19px)  article body (Libertinus runs small; 19px ≈ book size)
--text-lg:   1.5rem    (24px)  H3 / section labels
--text-xl:   1.875rem  (30px)  H2
--text-2xl:  clamp(2.25rem, 1.6rem + 2.5vw, 3.25rem)  H1 / page titles
--text-hero: clamp(2.75rem, 2rem + 4vw, 4.5rem)       hero name only
```

- Line-height: 1.65 body, 1.2 headings, 1.5 meta/mono.
- Article measure ~68ch; never exceed 72ch.
- Mono meta set in small caps effect: uppercase, `letter-spacing: 0.06em`,
  `--text-xs/sm`.

## 2. Spacing, grid, widths

- Spacing scale (rem): `0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 / 3 / 4 / 6 / 8` as
  `--space-1 … --space-10`. No arbitrary values in components.
- Page container: `max-width: 72rem` (1152px) with `padding-inline:
  clamp(1.25rem, 4vw, 3rem)`.
- Content widths inside container:
  - Article / prose: `max-width: 68ch`, left-aligned within container (not centered
    text, centered block).
  - Work entries / listings: `max-width: 52rem`.
  - Hero: full container width.
- Vertical rhythm: homepage sections separated by `--space-9/10` (6–8rem desktop,
  collapsing to 3–4rem mobile); heading margins asymmetric (more above, less below).
- Grid: no framework grid; CSS grid per-component (e.g. work entry:
  `grid-template-columns: minmax(8rem, 14rem) 1fr` collapsing to single column
  < 640px).

### Breakpoints

`640px` (single→entry columns), `880px` (nav/footer density), `1152px` (container
cap). Mobile-first media queries; three breakpoints max.

## 3. Color

Token-first, two themes. Values are starting points to be tuned on real screens:

```text
Light (default)                    Dark
--bg:        #FAFAF7  paper        #101014  near-black, slightly warm-cool
--bg-raised: #F2F2ED               #18181E
--text:      #1A1A1E               #E8E6E0
--text-mut:  #5C5C64               #9A98A0
--line:      #E0E0DA               #2A2A32
--accent:    #2F5DA8 (ink blue)    #7FA3E0
```

- **One accent color** used for: links, focus rings, small marks. Candidate is a
  restrained ink blue; final hue is an author taste call → Open Question OQ-4
  (doc 11). Everything else is warm-neutral monochrome.
- Contrast: all text/bg pairs must pass WCAG AA (body AAA where feasible); accent on
  bg ≥ 4.5:1.
- Dark mode: `prefers-color-scheme` with a manual toggle (persisted in
  `localStorage`, inline head script to avoid FOUC). Technical audience expects it
  (doc 02). The hero shader reads theme tokens as uniforms so the visual belongs to
  both themes.

## 4. Texture, borders, radius, shadow

- Borders: 1px `--line`; hairline rules are the primary separator (editorial), not
  cards.
- Radius: `2px` on small elements (tags, code inline), `6px` on images/teasers. No
  pill buttons.
- Shadows: essentially none; at most a 1px-offset tint on raised surfaces. Depth on
  this site comes from the WebGL hero, not box-shadows.
- Background texture: flat colors only. No gradients as decoration (gradient use is
  reserved for the hero fallback image if needed).

## 5. Imagery

- Publication/project teasers: fixed aspect ratio 4:3 (or 16:9 for video-ish work),
  `astro:assets` optimized, subtle 1px `--line` border, 6px radius, no hover zoom.
  Long-term aspiration (doc 02, Keenan Crane): uniform custom-styled teasers.
- Article figures: full text-column width, captions in mono `--text-sm`
  `--text-mut`, numbered when the post is long-form.
- Photography/portrait: only on `/about`, modest size, same border treatment.

## 6. Component treatments

- **Navigation**: text-only, mono, top row: name (serif, small) left; three links
  right. Current page: accent underline offset 6px. Hover: underline slides in
  ≤ 200ms ease-out. Sticky: no (page tops are short); revisit if articles get long
  TOCs.
- **Work entry** (Barron anatomy, doc 03): teaser left; right column: title (serif,
  `--text-lg`, link), authors line (Mengqi Yuan in bold, others plain/linked), mono
  venue+year row with equal-contribution/oral marks, one mono link row
  `paper · project · code · bibtex`; BibTeX expands in a `<details>` block styled as
  code.
- **Writing list item**: date (mono, fixed column) + title (serif) + description
  (muted) + tags. Hairline separators, no cards.
- **Footer**: single hairline above; mono links row; muted.
- **Code blocks**: Shiki dual theme synced to site theme; background `--bg-raised`;
  no line numbers by default; copy button optional (Phase 3 decision).
- **Math**: KaTeX, inherits body color; display math gets `--space-6` margins and
  horizontal scroll on overflow.

## 7. Motion inside the visual system

(Full interaction spec in doc 05.) Visual-system-level rules:

- Only `opacity`/`transform` animate; durations 150–250ms UI, 500–700ms once-only
  reveals; ease-out family.
- Body text, nav, lists never move after initial paint.
- `prefers-reduced-motion`: all non-essential animation collapses to none (tokens:
  `--motion-duration` set to 0ms globally).

## 8. Responsive rules

- Mobile: single column everywhere; teaser above entry text; hero visual keeps
  aspect but reduces DPR/complexity (doc 08); nav stays one row (3 short labels).
- Tap targets ≥ 44px; hover-only affordances must have visible non-hover state.
- Test matrix: 375px, 768px, 1280px, 1680px widths; light+dark; high-DPR.

## 9. The removal test

Every visual decision must hold with JavaScript disabled: the hero shows its static
placeholder composition (designed, not a gray box), reveals simply appear, and the
page reads as a finished editorial site. This is checked in Phase 2 acceptance
(doc 09) before any WebGL exists.
