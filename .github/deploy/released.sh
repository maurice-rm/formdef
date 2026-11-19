#!/usr/bin/env bash
set -euo pipefail

core_version=$(jq -r .version packages/core/package.json)
floors=$(jq -r '[.items[].dependencies[]? | select(startswith("@formdef/core@>=")) | ltrimstr("@formdef/core@>=")] | unique | .[]' packages/shadcn/registry.json)
published=$(npm view @formdef/core versions --json)

is_published() {
  jq -e --arg version "$1" '(if type == "array" then . else [.] end) | index($version) != null' <<< "$published" > /dev/null
}

not_yet() {
  echo "$1" >&2
  echo "released=false"
  exit 0
}

pending=$(grep -lE "^['\"]@formdef/core['\"]:" .changeset/*.md || true)
[[ -z $pending ]] || not_yet "Changesets for @formdef/core wait for a release: $(tr '\n' ' ' <<< "$pending")"
is_published "$core_version" || not_yet "@formdef/core $core_version is not on npm yet."
for floor in $floors; do
  is_published "$floor" || not_yet "The registry needs @formdef/core $floor, which is not on npm yet."
done

echo "Everything main documents is on npm." >&2
echo "released=true"
