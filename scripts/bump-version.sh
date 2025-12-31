#!/bin/bash
# Version bumping script for local use
# Usage: ./scripts/bump-version.sh [patch|minor|major]

set -e

VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "Error: Version type must be patch, minor, or major"
  exit 1
fi

# Get current version from root package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Bump version
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version | sed 's/v//')
echo "New version: $NEW_VERSION"

# Update backend package.json
cd apps/backend
npm version $NEW_VERSION --no-git-tag-version
cd ../..

# Update frontend package.json
cd apps/frontend
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = '$NEW_VERSION';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"
cd ../..

echo ""
echo "✅ Version bumped to $NEW_VERSION"
echo ""
echo "Next steps:"
echo "1. Review the changes: git diff"
echo "2. Commit: git add -A && git commit -m 'chore: bump version to $NEW_VERSION'"
echo "3. Create tag: git tag v$NEW_VERSION"
echo "4. Push: git push origin main && git push origin v$NEW_VERSION"

