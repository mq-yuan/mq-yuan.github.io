// Chinese job resume entry point (project-focused, for industry applications).
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

#show: cv-doc.with(
  name: r.name,
  font: (serif, "Songti SC"),
  lang: "zh",
  size: 10.5pt,
  // The bullet gap is the floor for every vertical gap (author, 2026-09-11):
  // line leading and paragraph spacing match it, and the build never scales
  // below 1.0.
  leading: 0.65em,
  spacing: 0.65em,
  list-spacing: 0.65em,
  justify: true,
  bottom: 1.5cm,
  doc-label: labels.document,
  updated-label: labels.updated,
  updated: datetime.today().display(labels.updated_format),
)

#let zsection = section.with(cjk: true, font: heading-font, above: 1.3em, below: 0.7em)
#let zentry = entry-line.with(font: heading-font, below: 1em, breakable: long)
#let dot = text(fill: colors.muted, " · ")
// Two-page variant uses the longer bullet lists where the data has them.
#let bullets(e) = {
  let items = if long and "bullets_long" in e { e.bullets_long } else { e.at("bullets", default: ()) }
  if items.len() > 0 { list(..items) }
}

#header(
  [#text(font: heading-font, weight: "bold", r.name) #h(0.4em) #text(size: 13pt, fill: colors.muted, profile.name)],
  r.tagline,
  contacts,
  photo: image("/src/assets/portrait.jpg", width: 2.3cm),
)

#zsection(labels.education)
#for e in r.education { zentry(e.title, e.subtitle, e.period, bullets(e)) }

#if long and "interests" in r {
  zsection(labels.interests)
  for i in r.interests {
    block(below: 0.8em * scale)[#text(font: heading-font, weight: "semibold", i.title)#linebreak()#i.summary]
  }
}

#zsection(labels.experience)
#for e in r.experience { zentry(e.title, e.subtitle, e.period, bullets(e)) }

#zsection(labels.projects)
#for e in r.projects { zentry(e.title, e.subtitle, e.period, bullets(e)) }

#if r.at("publications", default: ()).len() > 0 {
  let extra = if long { r.at("publications_extra", default: ()) } else { () }
  zsection(if extra.len() > 0 { labels.publications_long } else { labels.publications })
  for (i, w) in (r.publications + extra).enumerate() { publication(i + 1, markup(w)) }
}

#if long and "summary" in r {
  zsection(labels.summary)
  list(..r.summary)
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
