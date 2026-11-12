#!/bin/sh
# Builds a prototype folder into one standalone page.
#   kit/build.sh <prototype-folder> ["Page title"]
# The folder holds app.js (and any other *.js, loaded in name order before app.js).
# Writes <prototype-folder>/index.html.
set -e
KIT="$(cd "$(dirname "$0")" && pwd)"
DIR="$(cd "${1:?Usage: build.sh <prototype-folder> [title]}" && pwd)"
TITLE="${2:-$(basename "$DIR")}"
OUT="$DIR/index.html"
LIB="ui.js tier2.js icons.js ui2.js portal-icons.js portal.js nav.js sample.js wf.js toolbar.js proto.js"

[ -f "$DIR/app.js" ] || { echo "No app.js in $DIR" >&2; exit 1; }
EXTRA=$(cd "$DIR" && ls *.js 2>/dev/null | grep -v '^app\.js$' | sort || true)

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
for f in $LIB; do cat "$KIT/lib/$f"; done > "$TMP/lib.js"
# The design system list comes from one place: catalog/ds-components.txt.
DS=$(grep -v '^[[:space:]]*$' "$KIT/../catalog/ds-components.txt" | sed "s/.*/'&'/" | paste -sd, -)
DS="$DS" perl -pi -e 's{/\*DS_COMPONENTS\*/}{$ENV{DS}}' "$TMP/lib.js"
{ for f in $EXTRA; do cat "$DIR/$f"; done; cat "$DIR/app.js"; } > "$TMP/app.js"
if command -v node >/dev/null 2>&1; then node --check "$TMP/lib.js"; node --check "$TMP/app.js"; fi

{ awk -v f="$KIT/lookout-tailwind.js" -v t="$TITLE" '{ gsub(/\{\{TITLE\}\}/, t) } /\/\*SETUP\*\//{ while ((getline l < f) > 0) print l; next } { print }' "$KIT/head.html"
  echo '<script>'; cat "$TMP/lib.js"; echo '</script>'
  echo '<script>'; cat "$TMP/app.js"; echo '</script>'; } > "$OUT"
echo "Built $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes)"
