#!/bin/sh
# Rebuilds ../index.html from the parts in this folder. Needs only a POSIX shell (cat). Run:  sh build.sh
cd "$(dirname "$0")" || exit 1
cat p4a-engine.js p4b-widgets.js p4d-ui.js p4e-pw.js p4c-load.js > /tmp/mdna-main.$$.js
{
  printf '%s\n' '<!doctype html>' '<html lang="en">' '<head>' '<meta charset="utf-8">' '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  cat p1-head.html
  printf '%s\n' '</head>' '<body>'
  cat p2-body.html
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
  echo '<script>'
  cat p5-images.js p5b-hoods.js p5c-labels.js p6-pdf.js p3-targets.js; echo
  cat p3b-image.js; echo
  cat p3c-pose.js; echo
  cat /tmp/mdna-main.$$.js
  echo '</script>'
  printf '%s\n' '</body>' '</html>'
} > ../index.html
rm -f /tmp/mdna-main.$$.js
echo "built ../index.html"
