// Shared layout for the CVs. The visual language mirrors the site (doc 04
// tokens): Libertinus Serif, near-black text on paper, muted meta text, and
// the light-theme accent blue for links and section labels. No personal facts
// live here; the entry files read them from data and pass them in.

#let colors = (
  text: rgb("#1a1a1e"),
  muted: rgb("#5c5c64"),
  line: rgb("#e0e0da"),
  accent: rgb("#2f5da8"),
)

#let serif = "Libertinus Serif"

// Vertical-rhythm scale, set by cv/build.sh (`--input scale=1.08`) so a
// document ends close to the bottom margin of its last page instead of
// leaving a hole. Everything vertical except the header multiplies by it.
#let scale = float(sys.inputs.at("scale", default: "1"))

// Placed at the very end of a document; `typst query '<end-pos>'` reads the
// page and y where the content stops, which the build script uses to pick
// the scale.
#let end-marker = context {
  let p = here().position()
  [#metadata((page: p.page, y: p.y)) <end-pos>]
}

// Small tracked uppercase label, the print counterpart of the site's meta text.
#let meta(body, fill: colors.muted, size: 8pt) = text(
  size: size,
  tracking: 0.06em,
  fill: fill,
  upper(body),
)

// Section label with a hairline. Latin titles are small tracked capitals;
// CJK titles follow the convention of Chinese resume templates instead: a
// larger bold heading in the heading font over an accent rule.
#let section(title, cjk: false, font: none, above: 0.8em, below: 0.6em) = {
  let font-args = if font == none { (:) } else { (font: font) }
  v(above * scale)
  block(breakable: false, below: below * scale)[
    #if cjk {
      text(..font-args, fill: colors.accent, weight: "bold", size: 13pt, title)
      v(-0.35em)
      line(length: 100%, stroke: 0.6pt + colors.accent)
    } else {
      meta(fill: colors.accent, size: 8.5pt, text(weight: "semibold", title))
      v(-0.45em)
      line(length: 100%, stroke: 0.5pt + colors.line)
    }
  ]
}

// One dated row: left text, right-aligned muted period.
#let row(lhs, rhs, weight: "regular") = grid(
  columns: (1fr, auto),
  column-gutter: 1em,
  align: (left, right),
  text(weight: weight, lhs),
  if rhs != none { text(fill: colors.muted, size: 9pt, rhs) },
)

// A dated entry: bold title row, then optional detail lines (none is skipped).
// `below` is the gap to the next entry; keep it clearly larger than the line
// spacing so entries read as blocks.
// `breakable: true` (two-page variants) lets a long entry continue on the
// next page between bullets instead of jumping whole and leaving a hole.
#let entry(title, period, below: 0.9em, breakable: false, ..lines) = block(breakable: breakable, below: below * scale)[
  #row(title, period, weight: "semibold")
  #let body = lines.pos().filter(l => l != none)
  #if body.len() > 0 { body.join(linebreak()) }
]

// Entry whose first line carries title, subtitle and date together, the
// pattern of the common Chinese resume templates: accent title in the heading
// font, regular subtitle, muted date at the right. Bullets follow directly.
#let entry-line(title, subtitle, period, font: none, below: 0.8em, breakable: false, ..lines) = block(
  breakable: breakable,
  below: below * scale,
)[
  #let font-args = if font == none { (:) } else { (font: font) }
  #grid(
    columns: (auto, 1fr, auto),
    column-gutter: 0.6em,
    align: (left, left, right),
    text(..font-args, fill: colors.accent, weight: "semibold", title),
    if subtitle != none { subtitle },
    text(fill: colors.muted, size: 9.5pt, period),
  )
  #let body = lines.pos().filter(l => l != none)
  #if body.len() > 0 { body.join(linebreak()) }
]

// A numbered publication: muted [n] in the gutter, hanging body.
// Bibliography lines are ragged-right even in justified documents: long
// Latin titles have too few break points and would be stretched.
#let publication(n, body) = block(breakable: false, below: 0.7em, grid(
  columns: (1.9em, 1fr),
  column-gutter: 0.3em,
  text(fill: colors.muted, [\[#n\]]),
  { set par(justify: false); body },
))

// Name, one-line subtitle, a dot-separated contact line, optional photo.
#let header(name, subtitle, contacts, photo: none) = {
  let sep = text(fill: colors.muted, [#h(0.55em)·#h(0.55em)])
  let left-side = {
    text(size: 22pt, name)
    v(0.3em)
    text(fill: colors.muted, subtitle)
    v(0.55em)
    text(size: 9.5pt, contacts.filter(c => c != none).join(sep))
  }
  if photo == none {
    left-side
  } else {
    grid(
      columns: (1fr, auto),
      column-gutter: 1.5em,
      align: (left + horizon, right + top),
      left-side,
      photo,
    )
  }
  v(0.3em)
}

#let cv-doc(
  name: "",
  updated: none,
  font: serif,
  lang: "en",
  doc-label: "Curriculum Vitae",
  updated-label: "Updated",
  size: 10pt,
  leading: 0.58em,
  spacing: 0.75em,
  list-spacing: 0.45em,
  justify: false,
  // Bottom margin. The footer top sits `bottom - 0.6cm` below the body, which
  // leaves about 0.3 cm between the footer and the page edge; pick `bottom`
  // so that gap matches the gap between two sections (author, 2026-09-11).
  bottom: 1.2cm,
  body,
) = {
  set document(title: name + ", " + doc-label, author: name)
  set page(
    paper: "a4",
    margin: (x: 1.5cm, top: 1.2cm, bottom: bottom),
    footer-descent: bottom - 0.6cm,
    footer: context {
      let total = counter(page).final().first()
      set text(size: 8pt, fill: colors.muted)
      grid(
        columns: (1fr, auto),
        [#name · #doc-label#if updated != none [ · #updated-label #updated]],
        if total > 1 [#counter(page).display() / #total],
      )
    },
  )
  set text(font: font, size: size, fill: colors.text, lang: lang)
  // One uniform block gap: title to body, subtitle to bullets, and so on.
  set par(leading: leading * scale, spacing: spacing * scale, justify: justify, linebreaks: "optimized")
  // Discourage a lone word on the last line of a paragraph.
  set text(costs: (runt: 500%))
  set list(indent: 0.1em, body-indent: 0.5em, spacing: list-spacing * scale, marker: text(fill: colors.muted)[•])
  show link: set text(fill: colors.accent)
  body
}
