# S3 Package Installation

## Required AWS SDK Packages

To use S3 storage, you need to install the AWS SDK v3 packages.

### Installation Command

```bash
cd apps/backend
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Package Versions (Latest as of November 2024)

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.668.0",
    "@aws-sdk/s3-request-presigner": "^3.668.0"
  }
}
```

_Note: AWS SDK v3 packages are modular, so we only install what we need._

## What Each Package Does

### @aws-sdk/client-s3

The core S3 client for AWS SDK v3. Provides:

- `S3Client` - Main client for S3 operations
- `PutObjectCommand` - Upload files
- `GetObjectCommand` - Download files
- `DeleteObjectCommand` - Delete files
- `HeadObjectCommand` - Check file existence

**Size**: ~200KB (minified + gzipped)

### @aws-sdk/s3-request-presigner

Utility for generating presigned URLs. Provides:

- `getSignedUrl()` - Generate temporary access URLs

**Size**: ~50KB (minified + gzipped)

**Use case**: When you need time-limited access to S3 objects without making them public.

## Why These Packages?

1. **AWS SDK v3**: Modern, modular, tree-shakeable
2. **TypeScript Native**: First-class TypeScript support
3. **Smaller Bundle**: Only install what you use
4. **Better Performance**: Optimized for Node.js
5. **Active Maintenance**: Regular updates from AWS

## Alternative: AWS SDK v2 (Not Recommended)

```bash
# Don't use this - v2 is deprecated
pnpm add aws-sdk
```

❌ **Why not v2:**

- Larger bundle size (entire SDK ~40MB)
- Deprecated by AWS
- No tree-shaking
- Less performant

## Installation Verification

After installation, verify packages are installed:

```bash
# Check installed versions
pnpm list @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Should output:
# @aws-sdk/client-s3 3.668.0
# @aws-sdk/s3-request-presigner 3.668.0
```

## TypeScript Types

Types are included with the packages - no `@types/*` needed!

```typescript
import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';

// ✅ Full type inference and autocomplete
const client = new S3Client({region: 'us-east-1'});
```

## Development vs Production

These packages should be in **dependencies**, not **devDependencies**, because they're required at runtime when `STORAGE_TYPE=s3`.

```json
{
  "dependencies": {
    // ✅ Correct - runtime dependency
    "@aws-sdk/client-s3": "^3.668.0",
    "@aws-sdk/s3-request-presigner": "^3.668.0"
  },
  "devDependencies": {
    // ❌ Wrong - would fail in production
  }
}
```

## Package Size Impact

Total added size to your deployment:

| Package                       | Size (minified + gzipped) |
| ----------------------------- | ------------------------- |
| @aws-sdk/client-s3            | ~200 KB                   |
| @aws-sdk/s3-request-presigner | ~50 KB                    |
| **Total**                     | **~250 KB**               |

This is acceptable for backend applications and much smaller than AWS SDK v2 (~5-10 MB).

## If You're Using Docker

Add to your Dockerfile **before** `pnpm install`:

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (including AWS SDK)
RUN pnpm install --frozen-lockfile

# ... rest of Dockerfile
```

No special steps needed - they're regular npm packages!

## Troubleshooting

### Error: Cannot find module '@aws-sdk/client-s3'

**Solution**: Run `pnpm install` in `apps/backend` directory

### Error: Module not found in production

**Cause**: Packages in `devDependencies` instead of `dependencies`

**Solution**: Move to `dependencies` and redeploy

### TypeScript errors about missing types

**Cause**: Old TypeScript version or cache issue

**Solution**:

```bash
rm -rf node_modules
pnpm install
```

## Next Steps

After installation:

1. ✅ Packages installed
2. 📝 Configure `.env` with AWS credentials (see [s3-quick-setup.md](./s3-quick-setup.md))
3. 🚀 Restart your app
4. ✨ S3 storage is ready!

## Related Documentation

- [S3 Quick Setup Guide](./s3-quick-setup.md) - Fast track setup
- [Complete Migration Guide](./s3-migration-guide.md) - Detailed instructions
- [Implementation Summary](./S3_IMPLEMENTATION_SUMMARY.md) - What's included

## Support

AWS SDK Documentation:

- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Client Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Presigner Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_s3_request_presigner.html)
