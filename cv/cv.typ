// Academic CV entry point. Compile from the repository root so the absolute
// paths below resolve against it; cv/build.sh builds the one- and two-page
// variants (`--input pages=1|2`) and picks the vertical scale:
//
//   pnpm cv
//
// Personal facts are read from the site's content data (single source of
// truth, doc 07 §10); the CV never restates them. Public CV-only data
// (website, publication order, skills) lives in cv/data/cv.yaml. Research
// projects, the two-page expansions and private contact details live in the
// git-ignored cv/data/private/cv.yaml because they describe unreleased work;
// the compiled PDFs are not linked from the site.
#import "template.typ": *

#let profile = yaml("/src/content/data/profile.yaml").profile
#let cv = yaml("/cv/data/cv.yaml")
#let private = yaml("/cv/data/private/cv.yaml")
#let long = sys.inputs.at("pages", default: "1") == "2"

// The site's file() collections are keyed maps ordered by `order`.
#let by-order(map) = map.pairs().sorted(key: p => p.at(1).at("order", default: 0))
#let education = by-order(yaml("/src/content/data/education.yaml"))
#let experience = by-order(yaml("/src/content/data/experience.yaml"))
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

#let author-list(authors) = authors.map(a => {
  let name = if a.at("me", default: false) { strong(a.name) } else { a.name }
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

// Two pages leave room for the research directions in full.
#if long {
  section[Research Interests]
  for i in interests {
    block(below: 0.8em * scale)[#text(weight: "semibold", i.title) \ #i.summary]
  }
}

#section[Education]
#for (id, e) in education {
  let advisor = if "advisor" in e [Advisor: #link(e.advisor.url, e.advisor.name)]
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

#section[Research Experience]
#for (id, e) in experience {
  let role = if "advisor" in e [#e.title, advised by #link(e.advisor.url, e.advisor.name)] else [#e.title]
  let detail = if "detail" in e { text(fill: colors.muted, e.detail.trim(".", at: end)) }
  let extra = notes("experience_notes", id)
  entry(
    breakable: long,
    e.name,
    e.period,
    (role, detail).filter(x => x != none).join(text(fill: colors.muted, " · ")),
    if extra.len() > 0 { list(..extra) },
  )
}

#if private.at("projects", default: ()).len() > 0 {
  section[Research Projects]
  for p in private.projects {
    entry(
    breakable: long,
      p.title,
      p.period,
      if "affiliation" in p { text(fill: colors.muted, p.affiliation) },
      bullets(p),
    )
  }
}

#if publications.len() > 0 {
  section[Publications]
  for (i, w) in publications.enumerate() {
    let equal = w.authors.any(a => a.at("equal", default: false))
    let note = if equal { h(0.5em); text(size: 8.5pt, fill: colors.muted)[(\* equal contribution)] }
    publication(i + 1)[#author-list(w.authors). #w.title. #emph(venue(w)).#work-links(w)#note]
  }
  // Manuscripts in submission (two-page variant), stored as markup strings.
  if long {
    for (i, m) in private.at("publications_extra", default: ()).enumerate() {
      publication(publications.len() + i + 1, eval(m, mode: "markup"))
    }
  }
}

#if cv.at("skills", default: ()).len() > 0 {
  section[Skills]
  grid(
    columns: (13em, 1fr),
    row-gutter: 0.5em * scale,
    ..cv.skills.map(s => (text(fill: colors.muted, s.label), s.items)).flatten(),
  )
}

#end-marker
