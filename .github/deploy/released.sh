#!/usr/bin/env bash
set -euo pipefail

# The minimum versions of a package the registry's items require, such as `0.4.0` of `@formdef/core@>=0.4.0`.
floors_of() {
  jq -r --arg prefix "$1@>=" '[.items[].dependencies[]? | select(startswith($prefix)) | ltrimstr($prefix)] | unique | .[]' packages/shadcn/registry.json
}

is_published() {
  jq -e --arg version "$2" '(if type == "array" then . else [.] end) | index($version) != null' <<< "$1" > /dev/null
}

# The versions on npm, or none for a package npm does not know yet; any other failure stops here.
published_versions() {
  local output
  if output=$(npm view "$1" versions --json 2> /dev/null); then
    echo "$output"
    return
  fi
  jq -e '.error.code == "E404"' <<< "$output" > /dev/null || {
    echo "npm view $1 failed: $output" >&2
    return 1
  }
  echo '[]'
}

not_yet() {
  echo "$1" >&2
  echo "released=false"
  exit 0
}

for package in core document; do
  name="@formdef/$package"
  version=$(jq -r .version "packages/$package/package.json")
  published=$(published_versions "$name")
  pending=$(grep -lE "^['\"]$name['\"]:" .changeset/*.md || true)
  [[ -z $pending ]] || not_yet "Changesets for $name wait for a release: $(tr '\n' ' ' <<< "$pending")"
  is_published "$published" "$version" || not_yet "$name $version is not on npm yet."
  floors=$(floors_of "$name")
  for floor in $floors; do
    is_published "$published" "$floor" || not_yet "The registry needs $name $floor, which is not on npm yet."
  done
done

echo "Everything main documents is on npm." >&2
echo "released=true"
