# AWS S3 Migration Guide

This guide walks you through migrating from local file storage to AWS S3 for ticket document storage.

## Prerequisites

1. **AWS Account** - You'll need an active AWS account
2. **AWS CLI** (optional but recommended) - For testing and bucket management
3. **IAM User with S3 Permissions** - Create a dedicated IAM user for your application

## Step 1: Install AWS SDK

Install the AWS SDK v3 packages:

```bash
cd apps/backend
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Step 2: Create an S3 Bucket

### Using AWS Console

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/s3/)
2. Click "Create bucket"
3. Configure your bucket:
   - **Bucket name**: `your-app-name-tickets` (must be globally unique)
   - **Region**: Choose the region closest to your users (e.g., `us-east-1`)
   - **Block Public Access**: Keep all blocked (recommended for security)
   - **Versioning**: Enable (optional, but recommended for backup)
   - **Encryption**: Enable server-side encryption (recommended)

### Using AWS CLI

```bash
# Create bucket
aws s3 mb s3://your-app-name-tickets --region us-east-1

# Enable versioning (optional but recommended)
aws s3api put-bucket-versioning \
  --bucket your-app-name-tickets \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket your-app-name-tickets \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

## Step 3: Configure CORS (if needed)

If your frontend needs direct access to files, configure CORS:

```bash
aws s3api put-bucket-cors \
  --bucket your-app-name-tickets \
  --cors-configuration file://cors.json
```

**cors.json:**

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

## Step 4: Create IAM User and Policy

### Create IAM User

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Navigate to "Users" → "Add users"
3. User name: `revendiste-backend-s3`
4. Access type: "Programmatic access" (for Access Key ID and Secret)

### Create Custom Policy

Create a policy with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TicketDocumentStorage",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::your-app-name-tickets/*"
    },
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::your-app-name-tickets"
    }
  ]
}
```

Attach this policy to your IAM user.

### Save Credentials

After creating the user, save the credentials:

- **Access Key ID**: `AKIA...`
- **Secret Access Key**: `wJalrXUtnFEMI...`

⚠️ **Important**: Store these securely! You won't be able to retrieve the secret key again.

## Step 5: Update Environment Variables

Add the following to your `.env` file:

```env
# Storage Configuration
STORAGE_TYPE=s3

# AWS S3 Configuration
AWS_S3_BUCKET=your-app-name-tickets
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI...

# Optional: CloudFront CDN domain (see Step 7)
# AWS_CLOUDFRONT_DOMAIN=dxxxxx.cloudfront.net

# Optional: Signed URL expiry in seconds (default: 3600 = 1 hour)
# AWS_S3_SIGNED_URL_EXPIRY=3600
```

## Step 6: Test the Migration

### Test Upload

```typescript
import {getStorageProvider} from '~/services/storage';

const storage = getStorageProvider();

// Test upload
const testBuffer = Buffer.from('Hello S3!');
const result = await storage.upload(testBuffer, {
  originalName: 'test.txt',
  mimeType: 'text/plain',
  sizeBytes: testBuffer.length,
  directory: 'test',
  filename: 'test-upload',
});

console.log('Upload successful!', result);
// Should output: { path: 'test/test-upload.txt', url: 'https://...', sizeBytes: 9 }
```

### Test Download

```typescript
// Test download
const buffer = await storage.getBuffer(result.path);
console.log('Downloaded:', buffer.toString()); // Should output: "Hello S3!"

// Test existence
const exists = await storage.exists(result.path);
console.log('File exists:', exists); // Should output: true

// Test deletion
await storage.delete(result.path);
console.log('File deleted!');
```

## Step 7: Optional - Set Up CloudFront CDN

CloudFront is AWS's CDN service that can significantly improve download speeds and reduce S3 costs.

### Create CloudFront Distribution

1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Create Distribution
3. Configure:

   - **Origin Domain**: Select your S3 bucket
   - **Origin Access**: "Origin access control settings (recommended)"
   - **Create control setting**: Create new OAC
   - **Viewer Protocol Policy**: "Redirect HTTP to HTTPS"
   - **Allowed HTTP Methods**: GET, HEAD, OPTIONS
   - **Cache Policy**: CachingOptimized (or create custom)
   - **Price Class**: Choose based on your needs

4. After creation, note your **CloudFront domain** (e.g., `dxxxxx.cloudfront.net`)

5. Update S3 bucket policy to allow CloudFront access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-app-name-tickets/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

6. Add CloudFront domain to `.env`:

```env
AWS_CLOUDFRONT_DOMAIN=dxxxxx.cloudfront.net
```

## Step 8: Migrate Existing Files (if any)

If you have existing files in local storage, migrate them:

```typescript
import fs from 'fs/promises';
import path from 'path';
import {LocalStorageProvider, S3StorageProvider} from '~/services/storage';
import {
  AWS_S3_BUCKET,
  AWS_S3_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
} from '~/config/env';

async function migrateFiles() {
  const localStorage = new LocalStorageProvider('./uploads', '/uploads');
  const s3Storage = new S3StorageProvider({
    bucket: AWS_S3_BUCKET!,
    region: AWS_S3_REGION!,
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  });

  // Get all files from local storage
  const files = await findAllFiles('./uploads');

  for (const filePath of files) {
    try {
      // Read file from local storage
      const buffer = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);
      const relativePath = path.relative('./uploads', filePath);
      const mimeType = getMimeType(filePath);

      // Upload to S3
      await s3Storage.upload(buffer, {
        originalName: path.basename(filePath),
        mimeType,
        sizeBytes: stats.size,
        directory: path.dirname(relativePath),
        filename: path.parse(filePath).name,
      });

      console.log(`Migrated: ${relativePath}`);
    } catch (error) {
      console.error(`Failed to migrate ${filePath}:`, error);
    }
  }

  console.log('Migration complete!');
}

async function findAllFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, {withFileTypes: true});
  const files = await Promise.all(
    entries.map(entry => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? findAllFiles(fullPath) : [fullPath];
    }),
  );
  return files.flat();
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Run migration
migrateFiles();
```

## Step 9: Update Database References

If you're migrating existing files, update the database to point to new S3 paths:

```sql
-- Example: Update all document paths to S3 format
-- Only run this if you've successfully migrated all files to S3
UPDATE listing_tickets
SET document_path = 'tickets/' || document_path
WHERE document_path IS NOT NULL
  AND document_path NOT LIKE 'tickets/%';
```

## Step 10: Deploy and Monitor

1. **Deploy** your updated `.env` configuration
2. **Monitor** S3 metrics in CloudWatch:
   - Request count
   - Error rate
   - Data transfer
3. **Set up billing alerts** to avoid unexpected costs
4. **Test** document upload/download flows thoroughly

## Cost Optimization

### S3 Cost Tips

1. **Lifecycle Policies**: Archive old tickets to S3 Glacier after 6 months

   ```bash
   aws s3api put-bucket-lifecycle-configuration \
     --bucket your-app-name-tickets \
     --lifecycle-configuration file://lifecycle.json
   ```

2. **Intelligent Tiering**: Automatically move objects between access tiers

   ```json
   {
     "Rules": [
       {
         "Id": "intelligent-tiering-rule",
         "Status": "Enabled",
         "Transitions": [
           {
             "Days": 90,
             "StorageClass": "INTELLIGENT_TIERING"
           }
         ]
       }
     ]
   }
   ```

3. **CloudFront**: Reduces S3 requests by caching at edge locations

### Estimated Costs (as of 2024)

For **1,000 tickets/month** with **5MB average size**:

- **S3 Storage**: ~$0.12/month (5GB)
- **S3 PUT Requests**: ~$0.005 (1,000 uploads)
- **S3 GET Requests**: ~$0.004 (1,000 downloads × 10 views)
- **Data Transfer**: ~$0.90 (10GB out to internet)
- **CloudFront** (if used): ~$0.85 (reduces S3 costs)

**Total**: ~$1.00-2.00/month

## Rollback Plan

If you need to rollback to local storage:

1. Change `.env`:

   ```env
   STORAGE_TYPE=local
   ```

2. Restart your application

3. If needed, download files from S3:
   ```bash
   aws s3 sync s3://your-app-name-tickets ./uploads
   ```

## Security Best Practices

1. **Never commit AWS credentials** to version control
2. **Use IAM roles** instead of access keys when running on EC2/ECS
3. **Enable MFA Delete** for production buckets
4. **Regularly rotate** access keys (every 90 days)
5. **Monitor access** with CloudTrail
6. **Use signed URLs** for private content
7. **Enable bucket logging** for audit trails

## Troubleshooting

### Error: "Access Denied"

**Cause**: IAM permissions insufficient or bucket policy misconfigured.

**Solution**:

1. Verify IAM policy includes all required actions
2. Check bucket policy doesn't deny access
3. Verify bucket name and region are correct

### Error: "The specified bucket does not exist"

**Cause**: Bucket name incorrect or in different region.

**Solution**:

1. Double-check `AWS_S3_BUCKET` value
2. Verify bucket exists in specified `AWS_S3_REGION`

### Files upload but can't be downloaded

**Cause**: Missing `s3:GetObject` permission or incorrect URL generation.

**Solution**:

1. Verify IAM policy includes `s3:GetObject`
2. Check if bucket is in a different region than expected
3. Try using signed URLs for private buckets

### High S3 costs

**Cause**: Too many requests or large data transfer.

**Solution**:

1. Implement CloudFront CDN
2. Enable intelligent tiering
3. Review and optimize file sizes
4. Implement lifecycle policies

## Support

For issues specific to AWS:

- [AWS Support Center](https://console.aws.amazon.com/support/)
- [AWS Documentation](https://docs.aws.amazon.com/s3/)
- [AWS Forums](https://forums.aws.amazon.com/)

For application-specific issues, check the main [ticket-document-system.md](./ticket-document-system.md) documentation.
