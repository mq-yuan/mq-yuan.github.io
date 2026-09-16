// Chinese job resume entry point (project-focused, for campus recruitment).
//
// Sections: education, internship, projects, other research activity,
// publications, skills. No research-agenda sections: the two-page variant
// differs from the one-page one only by longer bullet lists and the
// manuscript under review.
//
//   pnpm cv            (cv/build.sh builds resume-zh-1p.pdf and resume-zh-2p.pdf)
//
// Every Chinese string, section labels included, comes from the git-ignored
// cv/data/private/resume-zh.yaml, so this file stays English-only and the
// resume content (unreleased work, phone number) stays out of the public
// repository. Contacts and the photo are shared with the English CV.
//
// Typography follows the common Chinese resume templates: serif body (Songti
// for CJK, Libertinus for Latin, as on the site), a sans heading font for the
// name, section titles and entry titles, justified text, and entries whose
// first line carries title, role and date together.
#import "template.typ": *

#let profile = yaml("/src/content/data/profile.yaml").profile
#let cv = yaml("/cv/data/cv.yaml")
#let r = yaml("/cv/data/private/resume-zh.yaml")
#let labels = r.labels
#let heading-font = "PingFang SC"
#let long = sys.inputs.at("pages", default: "1") == "2"

#let strip(url) = url.replace(regex("^https?://"), "").trim("/")
#let contacts = (
  r.at("phone", default: none),
  link("mailto:" + profile.email, profile.email),
  if "website" in cv { link(cv.website, strip(cv.website)) },
  if profile.scholar != "" { link(profile.scholar, "Google Scholar") },
)

// Publication lines are stored as Typst markup strings so the data file can
// bold the author's own name.
#let markup(s) = eval(s, mode: "markup")

// Two rhythms (author, 2026-09-16). One page: 10.5 pt, the compact fallback,
// scaled by the build to fill its page. Two pages: the default application
// version, a designed layout at a fixed scale with larger type; ComGS starts
// page two and no core project may cross a page, so the page is not meant to
// be filled. Both share the same vertical chain, line gap = bullet gap <
// entry gap < section gap, so the eye can tell "same bullet", "same
// project" and "next project" apart by white space alone. The 0.90em leading
// was chosen in an A/B against 0.75em and 0.95em: CJK glyphs fill their em
// box, so 0.75em read as lines touching in the long mixed-script bullets,
// while at 0.95em the bullet gap no longer exceeded the line gap and the
// bullets blurred together; the bullet gap then moved up to 0.90em as well.
// The one page paid for its 0.90em gaps with content: no citation block
// (`publications_short` is empty) and no undergraduate honors line (2p only).
// `spacing` is the paragraph gap, i.e. title line to first bullet and, in
// the two-page variant, intro line to first bullet.
#let rhythm = if long {
  (size: 11pt, leading: 0.90em, spacing: 0.90em, list: 0.90em, entry: 1.6em, above: 1.9em, below: 0.9em)
} else {
  (size: 10.5pt, leading: 0.90em, spacing: 0.65em, list: 0.90em, entry: 1.4em, above: 1.6em, below: 0.8em)
}

#show: cv-doc.with(
  name: r.name,
  font: (serif, "Songti SC"),
  lang: "zh",
  size: rhythm.size,
  leading: rhythm.leading,
  spacing: rhythm.spacing,
  list-spacing: rhythm.list,
  justify: true,
  bottom: 1.5cm,
  doc-label: labels.document,
  updated-label: labels.updated,
  updated: datetime.today().display(labels.updated_format),
)

#let zsection = section.with(cjk: true, font: heading-font, above: rhythm.above, below: rhythm.below)
// Entries never break across pages: a core project must be read whole.
#let zentry = entry-line.with(font: heading-font, below: rhythm.entry, breakable: false)
// A bullet is either a plain string or (anchor, text): a short anchor that
// names the capability or result, set in the heading font so the eye can
// scan it, then the body after a full-width colon.
#let bullet(it) = if type(it) == str { it } else {
  [#text(font: heading-font, weight: "medium", it.anchor)：#it.text]
}
// Two-page variant uses the longer bullet lists where the data has them, and
// opens each entry with its one-line definition (`intro`) in muted text.
#let body(e) = {
  let items = if long and "bullets_long" in e { e.bullets_long } else { e.at("bullets", default: ()) }
  if long and "intro" in e { par(text(fill: colors.muted, e.intro)) }
  if items.len() > 0 { list(..items.map(bullet)) }
}
// `subtitle_long` replaces the subtitle in the two-page variant, where the
// intro line already explains the project.
#let subtitle(e) = if long { e.at("subtitle_long", default: e.subtitle) } else { e.subtitle }
// Marks where page one ends in the two-page variant, for cv/build.sh.
#let page-end = context {
  let p = here().position()
  [#metadata((page: p.page, y: p.y)) <page-end>]
}

#header(
  [#text(font: heading-font, weight: "bold", r.name) #h(0.4em) #text(size: 13pt, fill: colors.muted, profile.name)],
  r.tagline,
  contacts,
  photo: image("/src/assets/portrait.jpg", width: 2.3cm),
)

#zsection(labels.education)
#for e in r.education { zentry(e.title, e.subtitle, e.period, body(e)) }

#zsection(labels.experience)
#for e in r.experience { zentry(e.title, subtitle(e), e.period, body(e)) }

#zsection(labels.projects)
// `page_break: true` on an entry starts it on a new page in the two-page
// variant under a "continued" heading (ComGS opens page two, author
// 2026-09-16).
#for e in r.projects {
  if long and e.at("page_break", default: false) {
    page-end
    pagebreak()
    zsection(labels.projects_continued)
  }
  zentry(e.title, subtitle(e), e.period, body(e))
}

// One-line items (no bullets) that carry little weight for industry roles,
// such as grant writing. `long_only: true` keeps an item out of the one-page
// variant, as in the English CV.
#let other = r.at("other", default: ()).filter(e => long or not e.at("long_only", default: false))
#if other.len() > 0 {
  zsection(labels.other)
  for e in other { zentry(e.title, e.subtitle, e.period, body(e)) }
}

// The one-page variant cites from `publications_short` (empty at the moment,
// so it has no citation block); the two-page variant adds the manuscripts
// under review.
#let pubs = if long { r.publications } else { r.at("publications_short", default: r.publications) }
#if pubs.len() > 0 {
  let extra = if long { r.at("publications_extra", default: ()) } else { () }
  zsection(if extra.len() > 0 { labels.publications_long } else { labels.publications })
  for (i, w) in (pubs + extra).enumerate() { publication(i + 1, markup(w)) }
}

#if r.at("skills", default: ()).len() > 0 {
  zsection(labels.skills)
  grid(
    columns: (7.5em, 1fr),
    row-gutter: 0.5em * scale,
    ..r.skills.map(s => (text(fill: colors.muted, s.label), s.items)).flatten(),
  )
}

#end-marker
