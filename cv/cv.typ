// Academic CV entry point. Compile from the repository root so the absolute
// paths below resolve against it; cv/build.sh builds the one- and two-page
// variants (`--input pages=1|2`) and picks the vertical scale:
//
//   pnpm cv
//
// Personal facts are read from the site's content data (single source of
// truth, doc 07 §10); the CV never restates them. Public CV-only data
// (website, publication order, research focus) lives in cv/data/cv.yaml.
// Research projects, the two-page expansions and private contact details live
// in the git-ignored cv/data/private/cv.yaml because they describe unreleased
// work; the compiled PDFs are not linked from the site.
//
// Page order (PhD applications, 2026-09-14): page one is focus, education,
// publications and manuscripts and the lead project; page two is ComGS, the
// joint-lab project, the two ongoing directions, one activity line and one
// technical-background line.
#import "template.typ": *

#let profile = yaml("/src/content/data/profile.yaml").profile
#let cv = yaml("/cv/data/cv.yaml")
#let private = yaml("/cv/data/private/cv.yaml")
#let long = sys.inputs.at("pages", default: "1") == "2"

// The site's file() collections are keyed maps ordered by `order`.
#let by-order(map) = map.pairs().sorted(key: p => p.at(1).at("order", default: 0))
#let education = by-order(yaml("/src/content/data/education.yaml"))
#let interests = by-order(yaml("/src/content/data/interests.yaml")).map(p => p.at(1))

// Two-page variant: extra bullets keyed by the site entry id.
#let notes(section, id) = if long { private.at(section, default: (:)).at(id, default: ()) } else { () }
#let bullets(e) = {
  let items = if long and "bullets_long" in e { e.bullets_long } else { e.at("bullets", default: ()) }
  if items.len() > 0 { list(..items) }
}

// Works are Markdown files with YAML front matter; take the block between the
// first two `---` lines.
#let work(id) = yaml(bytes(read("/src/content/works/" + id + ".md").split("---").at(1)))
#let publications = cv.at("publications", default: ()).map(work)
#let manuscripts = private.at("publications_extra", default: ())

// One-page variant: "Xiao-Xiao Long" becomes "X.-X. Long".
#let initial(part) = part.split("-").map(p => p.first() + ".").join("-")
#let short-name(name) = {
  let parts = name.split(" ")
  (parts.slice(0, -1).map(initial) + (parts.last(),)).join(" ")
}
#let author-list(authors) = authors.map(a => {
  let shown = if long { a.name } else { short-name(a.name) }
  let name = if a.at("me", default: false) { strong(shown) } else { shown }
  if a.at("equal", default: false) [#name#super[\*]] else [#name]
}).join(", ")

#let venue(w) = {
  let status = w.at("status", default: "published")
  let highlight = w.at("highlight", default: none)
  // Tilde: keep venue and year on one line.
  let base = if status == "preprint" [arXiv preprint, #w.year] else [#w.venue~#w.year]
  if highlight != none [#base (#highlight)] else [#base]
}

#let work-links(w) = {
  let links = w.at("links", default: (:))
  let labels = (("paper", "Paper"), ("project", "Project"), ("code", "Code"), ("video", "Video"))
  let items = labels.filter(p => p.first() in links).map(p => link(links.at(p.first()), p.last()))
  if items.len() > 0 {
    h(0.5em)
    text(size: 9pt, items.join(text(fill: colors.muted, " · ")))
  }
}

// Small italic label that groups publications (peer-reviewed, under review).
#let sublabel(body) = block(below: 0.4em * scale, text(size: 9pt, style: "italic", fill: colors.muted, body))

// Project entry: title row, then role (regular ink) and affiliation (muted).
#let project(p) = {
  let role = if "role" in p { text(weight: "semibold", p.role) }
  let affiliation = if "affiliation" in p { text(fill: colors.muted, p.affiliation) }
  entry(
    breakable: long,
    p.title,
    p.period,
    (role, affiliation).filter(x => x != none).join(text(fill: colors.muted, " · ")),
    bullets(p),
  )
}

#let strip(url) = url.replace(regex("^https?://"), "").trim("/")
#let contacts = (
  link("mailto:" + profile.email, profile.email),
  private.at("phone", default: none),
  if "website" in cv { link(cv.website, strip(cv.website)) },
  if profile.scholar != "" { link(profile.scholar, "Google Scholar") },
  private.at("location", default: none),
)

#show: cv-doc.with(
  name: profile.name,
  updated: datetime.today().display("[month repr:long] [year]"),
)

// Research directions sit in the header: the photo sets its height anyway.
#header(
  profile.name,
  [#profile.degree · #profile.affiliation \
    #interests.map(i => i.title).join(" · ")],
  contacts,
  photo: image("/src/assets/portrait.jpg", width: 2cm),
)

// Two pages carry the full focus paragraph, one page the two-line version.
#let focus = cv.at(if long { "focus" } else { "focus_short" }, default: none)
#if focus != none {
  section[Research Focus]
  eval(focus, mode: "markup")
}

#section[Education]
#for (id, e) in education {
  // One page: the advisor only on the current degree (order 0).
  let advisor = if "advisor" in e and (long or e.at("order", default: 0) == 0) [Advisor: #link(e.advisor.url, e.advisor.name)]
  let group = if "group" in e [#link(e.group.url, e.group.name)]
  // Degree, advisor and group run on as one paragraph and wrap naturally.
  let degree = if "detail" in e [#e.title, #e.detail] else [#e.title]
  let extra = notes("education_notes", id)
  entry(
    breakable: long,
    e.name,
    e.period,
    (degree, advisor, group).filter(x => x != none).join(text(fill: colors.muted, " · ")),
    if extra.len() > 0 { list(..extra) },
  )
}

#if publications.len() + manuscripts.len() > 0 {
  section(if manuscripts.len() > 0 [Publications & Manuscripts] else [Publications])
  if manuscripts.len() > 0 { sublabel[Peer-reviewed] }
  for (i, w) in publications.enumerate() {
    let equal = w.authors.any(a => a.at("equal", default: false))
    let note = if equal { h(0.5em); text(size: 8.5pt, fill: colors.muted)[(\* equal contribution)] }
    publication(i + 1)[#author-list(w.authors). #w.title. #emph(venue(w)).#work-links(w)#note]
  }
  // Manuscripts in submission, stored as markup strings.
  if manuscripts.len() > 0 { sublabel[Under review] }
  for (i, m) in manuscripts.enumerate() {
    publication(publications.len() + i + 1, eval(m, mode: "markup"))
  }
}

// Research experience spans both pages: the lead project closes page one,
// ComGS and the joint-lab project open page two under a continued header, so
// no entry ever crosses the page break (user, 2026-09-14).
#if private.at("selected", default: ()).len() > 0 {
  section[Research Experience]
  for p in private.selected { project(p) }
}

#if private.at("additional", default: ()).len() > 0 {
  if long {
    pagebreak()
    section(above: 0em)[Research Experience (continued)]
  }
  for p in private.additional.filter(p => long or not p.at("long_only", default: false)) { project(p) }
}

#if long and private.at("ongoing", default: ()).len() > 0 {
  section[Ongoing Research Directions]
  for p in private.ongoing { project(p) }
}

#if not long and private.at("one_page_notes", default: ()).len() > 0 {
  section[Ongoing & Additional Research]
  list(..private.one_page_notes.map(n => eval(n, mode: "markup")))
}

#if long and private.at("activities", default: ()).len() > 0 {
  section[Additional Research Activity]
  list(..private.activities)
}

#if long and "technical_background" in cv {
  section[Technical Background]
  cv.technical_background
}

#end-marker
