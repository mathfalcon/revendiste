# Cloudflare R2 Storage Implementation

## Overview

Revendiste now supports Cloudflare R2 for object storage, providing a cost-effective alternative to AWS S3 with built-in CDN capabilities. The implementation supports both public and private buckets.

## Architecture

### Bucket Strategy

- **Public Bucket**: Stores publicly accessible assets (website assets, event images, etc.)

  - Accessible via CDN at `cdn-dev.revendiste.com` (dev) or `cdn.revendiste.com` (prod)
  - No authentication required
  - Optimized for fast delivery

- **Private Bucket**: Stores sensitive documents (ticket documents, user files, etc.)
  - Requires presigned URLs for access
  - Secure and access-controlled
  - Time-limited access via signed URLs

### Explicit Bucket Selection via Path Prefix

The R2 provider uses **explicit path prefixes** to determine which bucket to use. All paths **must** start with either `public/` or `private/`:

**Public bucket** (paths must start with `public/`):

- `public/assets/...` - Website assets, app images
- `public/events/...` - Event images, banners
- `public/...` - Any other public content

**Private bucket** (paths must start with `private/`):

- `private/tickets/...` - Ticket documents
- `private/documents/...` - User documents, sensitive files
- `private/...` - Any other private content

**Important**: If a path doesn't start with `public/` or `private/`, it defaults to `private/` for security.

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Storage Configuration
STORAGE_TYPE=r2

# Cloudflare R2 Configuration
R2_PUBLIC_BUCKET=dev-revendiste-public
R2_PRIVATE_BUCKET=dev-revendiste-private
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_CDN_DOMAIN=cdn-dev.revendiste.com  # Optional, for public assets
R2_SIGNED_URL_EXPIRY=3600  # Signed URL expiry in seconds (default: 1 hour)
```

### Getting R2 Credentials

1. Go to Cloudflare Dashboard → R2
2. Click "Manage R2 API Tokens"
3. Create a new API token with:
   - **Permissions**: Object Read & Write
   - **Buckets**: Select both public and private buckets
4. Save the Access Key ID and Secret Access Key

## Infrastructure Setup

### Terraform

The infrastructure is configured in `infrastructure/dev/r2.tf`:

- Creates two R2 buckets (public and private)
- Sets up CDN custom domain (requires manual configuration in Cloudflare Dashboard)

### CDN Custom Domain Setup

After running Terraform:

1. Go to Cloudflare Dashboard → R2 → Select the public bucket
2. Go to "Settings" → "Public Access" → "Custom Domain"
3. Add custom domain: `cdn-dev.revendiste.com` (or `cdn.revendiste.com` for prod)
4. Cloudflare will automatically create the DNS record
5. Wait for DNS propagation (usually a few minutes)

## Usage

### Basic Upload

```typescript
import {getStorageProvider} from '~/services/storage';

const storage = getStorageProvider();

// Upload to public bucket (must start with 'public/')
const publicResult = await storage.upload(buffer, {
  originalName: 'event-image.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: buffer.length,
  directory: 'public/assets/events', // Explicitly goes to public bucket
});

// Upload to private bucket (must start with 'private/')
const privateResult = await storage.upload(buffer, {
  originalName: 'ticket.pdf',
  mimeType: 'application/pdf',
  sizeBytes: buffer.length,
  directory: 'private/tickets/event-123', // Explicitly goes to private bucket
});
```

### Getting URLs

```typescript
import {getStorageProvider} from '~/services/storage';

const storage = getStorageProvider();

// getUrl() automatically handles public vs private files
// For public files - returns CDN URL
const publicUrl = await storage.getUrl('public/assets/events/photo.jpg');
// Returns: https://cdn-dev.revendiste.com/public/assets/events/photo.jpg

// For private files - automatically generates signed URL
const privateUrl = await storage.getUrl('private/tickets/event-123/ticket.pdf');
// Returns: https://...r2.cloudflarestorage.com/...?signature=...
```

### Automatic URL Handling

The `getUrl()` method automatically:

- Detects if a file is private (paths starting with `private/`)
- Generates signed URLs for private files
- Returns CDN URLs for public files

```typescript
// Works for both public and private files
const url = await storageProvider.getUrl(filePath);
```

## Migration from S3

To migrate from S3 to R2:

1. **Update environment variables**:

   ```env
   STORAGE_TYPE=r2
   # Remove AWS_S3_* variables
   # Add R2_* variables
   ```

2. **Create R2 buckets** using Terraform:

   ```bash
   cd infrastructure/dev
   terraform apply
   ```

3. **Migrate existing files** (if needed):

   - Use AWS CLI to download from S3
   - Upload to R2 using the storage provider
   - Update database references if paths changed

4. **Update CDN configuration**:
   - Set up custom domain in Cloudflare Dashboard
   - Update `R2_CDN_DOMAIN` environment variable

## Cost Comparison

### R2 Pricing (as of 2024)

- **Storage**: $0.015/GB/month (first 10GB free)
- **Class A Operations** (writes): $4.50/million (first 1M free)
- **Class B Operations** (reads): $0.36/million (first 10M free)
- **Egress**: Free (unlimited)

### Estimated Monthly Cost

For **1,000 tickets/month** with **5MB average size**:

- **Storage**: ~$0.08/month (5GB)
- **Class A Operations**: ~$0.0045 (1,000 uploads)
- **Class B Operations**: ~$0.0004 (10,000 reads)
- **Egress**: Free

**Total**: ~$0.09/month (vs ~$1-2/month for S3)

## Benefits

1. **Cost Savings**: Significantly cheaper than S3, especially for egress
2. **Built-in CDN**: Cloudflare's global network for fast delivery
3. **No Egress Fees**: Unlimited data transfer out
4. **S3-Compatible API**: Easy migration from S3
5. **Integrated**: Works seamlessly with Cloudflare DNS and services

## Security

- **Private Buckets**: All sensitive files go to private bucket
- **Presigned URLs**: Time-limited access for private files (default: 1 hour)
- **IAM-like Access**: R2 API tokens with bucket-level permissions
- **HTTPS Only**: All access via HTTPS
- **CDN Security**: Cloudflare's DDoS protection and security features

## Troubleshooting

### Error: "Access Denied"

- Verify R2 API token has correct permissions
- Check bucket names match environment variables
- Ensure account ID is correct

### Error: "Bucket not found"

- Verify bucket names in Terraform match environment variables
- Check buckets exist in Cloudflare Dashboard

### CDN Not Working

- Verify custom domain is configured in Cloudflare Dashboard
- Check DNS record exists (created automatically by Cloudflare)
- Wait for DNS propagation (can take a few minutes)

### Signed URLs Not Working

- Verify `R2_SECRET_ACCESS_KEY` is correct
- Check `R2_SIGNED_URL_EXPIRY` is set appropriately
- Ensure file path starts with `private/` prefix

## Best Practices

1. **Always use explicit prefixes**: Paths must start with `public/` or `private/`
2. **Organize within buckets**: Use subdirectories like `public/assets/`, `public/events/`, `private/tickets/`
3. **Use `getUrl()` method**: Automatically handles signed URLs for private files and CDN URLs for public files
4. **Set appropriate expiry**: Adjust `R2_SIGNED_URL_EXPIRY` based on use case
5. **Monitor costs**: Set up Cloudflare billing alerts
6. **Use CDN for public assets**: All `public/` paths are served via CDN

## API Reference

### R2StorageProvider

```typescript
class R2StorageProvider implements IStorageProvider {
  // Upload file (auto-detects bucket from directory)
  upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult>;

  // Delete file
  delete(path: string): Promise<boolean>;

  // Get URL (public files get CDN URL, private files get placeholder)
  getUrl(path: string): string;

  // Check if file exists
  exists(path: string): Promise<boolean>;

  // Get file buffer
  getBuffer(path: string): Promise<Buffer>;

  // Generate signed URL for private files
  getSignedUrl(path: string, expiresIn?: number): Promise<string>;
}
```

### Helper Functions

```typescript
// Get appropriate URL (signed for private, CDN for public)
getFileUrl(storageProvider: IStorageProvider, path: string): Promise<string>
```
