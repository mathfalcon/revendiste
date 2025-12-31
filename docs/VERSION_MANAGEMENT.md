# Version Management

This document explains how version management works in the Revendiste project.

## Overview

The project uses semantic versioning (SemVer) with the format `MAJOR.MINOR.PATCH` (e.g., `1.2.3`). Versions are stored in:

- Root `package.json`
- `apps/backend/package.json`
- `apps/frontend/package.json`

## Version Bumping

### Option 1: GitHub Actions Workflow (Recommended)

1. Go to **Actions** → **Bump Version** workflow
2. Click **Run workflow**
3. Select version type:
   - **patch**: Bug fixes (1.0.0 → 1.0.1)
   - **minor**: New features (1.0.0 → 1.1.0)
   - **major**: Breaking changes (1.0.0 → 2.0.0)
4. The workflow will:
   - Bump versions in all package.json files
   - Create a Pull Request with the changes
5. Review and merge the PR
6. **Automatically**: After merging, the `auto-tag-version.yml` workflow will:
   - Detect the version bump PR
   - Extract the new version from package.json
   - Create and push the git tag (e.g., `v1.0.1`)
7. The tag push will trigger the **Deploy to Production** workflow, which builds and deploys to production

### Option 2: Local Script

Use the provided script for local version bumping:

```bash
# Bump patch version (1.0.0 → 1.0.1)
./scripts/bump-version.sh patch

# Bump minor version (1.0.0 → 1.1.0)
./scripts/bump-version.sh minor

# Bump major version (1.0.0 → 2.0.0)
./scripts/bump-version.sh major
```

The script will:

1. Bump the version in all package.json files
2. Show you the next steps (commit, tag, push)

Then manually:

```bash
git add -A
git commit -m "chore: bump version to 1.0.1"
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

## Release Workflow

When a version tag is pushed (e.g., `v1.2.3`), the **Deploy to Production** workflow automatically:

1. **Builds Docker images** with multiple tags:

   - `latest` (always updated)
   - `1.2.3` (exact version)
   - `1.2` (major.minor)
   - `1` (major only)

2. **Deploys to ECS**:

   - Updates backend service
   - Updates frontend service
   - Waits for deployments to stabilize
   - Performs health checks

3. **Creates GitHub Release**:
   - Creates a release with the version tag
   - Includes deployment information and image tags

## Production Deployment

### Automatic Release (Recommended - Fully Automated)

**Complete automated flow**:

1. **Bump Version**: Run "Bump Version" workflow → Creates PR
2. **Merge PR**: Review and merge the version bump PR
3. **Auto-Tag**: `auto-tag-version.yml` workflow automatically:
   - Detects the merged version bump PR
   - Extracts version from `package.json`
   - Creates and pushes git tag (e.g., `v1.2.3`)
4. **Auto-Deploy**: `deploy-production.yml` workflow automatically:
   - Builds versioned Docker images
   - Deploys to ECS
   - Creates GitHub Release

**No manual steps required!** The entire process from version bump to production deployment is automated.

### Manual Deployment (via Main Branch)

The `deploy-production.yml` workflow also runs on pushes to `main`:

- Builds images with `latest` and `main-<sha>` tags
- Deploys to ECS
- Uses `latest` tag (which matches the task definition default)
- **Note**: This is for development/testing deployments, not versioned releases

## Version Tag Format

- ✅ **Correct**: `v1.2.3`, `v2.0.0`, `v1.0.1`
- ❌ **Incorrect**: `1.2.3` (missing 'v'), `v1.2` (missing patch), `version-1.2.3`

## Best Practices

1. **Use semantic versioning**: Follow [SemVer](https://semver.org/) guidelines
2. **Use automated workflow**: Prefer the GitHub Actions "Bump Version" workflow for consistency
3. **Review before merging**: Always review the version bump PR before merging
4. **Let automation handle tags**: Don't manually create tags - the `auto-tag-version.yml` workflow handles this
5. **Document breaking changes**: In major version bumps, document what changed in the PR description
6. **Monitor deployments**: After merging, monitor the deployment workflow to ensure successful deployment

## Workflow Files

- `.github/workflows/bump-version.yml` - Version bumping workflow (creates PR)
- `.github/workflows/auto-tag-version.yml` - Automatically creates tag after version bump PR is merged
- `.github/workflows/deploy-production.yml` - Builds, deploys, and creates GitHub Release on tag push
- `scripts/bump-version.sh` - Local version bumping script
