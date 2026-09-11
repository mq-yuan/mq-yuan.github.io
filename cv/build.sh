#!/usr/bin/env bash
# Build the four CV PDFs (English/Chinese, one/two pages) into cv/out/.
#
# For each document the script scans the vertical-rhythm scale (see
# `scale` in cv/template.typ) and keeps the largest value at which the
# content still ends on the target page, so a one-page CV fills its page
# instead of leaving a hole at the bottom. It prints where each document
# ends as a share of the usable page height.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p cv/out

# A4 height (841.89 pt) minus each document's bottom margin (cv-doc `bottom`
# in cv/template.typ: 1.2 cm for the English CV, 1.5 cm for the Chinese one).
BOTTOM_EN=807.9
BOTTOM_ZH=799.4

end_pos() { # entry pages scale -> "page y"
  typst query --root . --input "pages=$2" --input "scale=$3" "$1" '<end-pos>' \
    --field value --one 2>/dev/null \
    | sed -E 's/.*"page":([0-9]+).*"y":"([0-9.]+)pt".*/\1 \2/'
}

build() { # entry pages out bottom_pt
  local entry=$1 pages=$2 out=$3 bottom=$4 best="" best_y=0 scale page y lo hi
  # Never below 1.0: the base rhythm is the minimum the author accepts, so a
  # document that does not fit at 1.0 needs less content, not tighter lines.
  # Coarse scan for the scale that ends lowest on the target page (unbreakable
  # entries jump pages, so the fill is not monotonic in the scale), then a
  # fine scan around it.
  for scale in $(seq 1.00 0.05 1.30); do
    read -r page y < <(end_pos "$entry" "$pages" "$scale")
    if [ "$page" -eq "$pages" ] && [ "$(echo "$y > $best_y" | bc)" -eq 1 ]; then
      best=$scale; best_y=$y
    fi
  done
  if [ -z "$best" ]; then
    echo "$out: does not fit on $pages page(s) at scale 1.0; trim content" >&2
    exit 1
  fi
  lo=$(echo "if ($best - 0.04 < 1) 1 else $best - 0.04" | bc); hi=$(echo "$best + 0.04" | bc)
  for scale in $(seq "$lo" 0.01 "$hi"); do
    read -r page y < <(end_pos "$entry" "$pages" "$scale")
    if [ "$page" -eq "$pages" ] && [ "$(echo "$y > $best_y" | bc)" -eq 1 ]; then
      best=$scale; best_y=$y
    fi
  done
  typst compile --root . --input "pages=$pages" --input "scale=$best" "$entry" "$out"
  printf '%-28s scale %-5s ends on page %s at %3.0f%% of the page\n' \
    "$out" "$best" "$pages" "$(echo "100 * $best_y / $bottom" | bc -l)"
}

build cv/cv.typ        1 cv/out/cv-1p.pdf        $BOTTOM_EN
build cv/cv.typ        2 cv/out/cv-2p.pdf        $BOTTOM_EN
build cv/resume-zh.typ 1 cv/out/resume-zh-1p.pdf $BOTTOM_ZH
build cv/resume-zh.typ 2 cv/out/resume-zh-2p.pdf $BOTTOM_ZH
