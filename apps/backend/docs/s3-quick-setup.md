# S3 Quick Setup - TL;DR

Need to switch to S3 storage quickly? Here's the essentials.

## 1. Install AWS SDK

```bash
cd apps/backend
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## 2. Create S3 Bucket

Via AWS Console or CLI:

```bash
aws s3 mb s3://your-bucket-name --region us-east-1
```

## 3. Create IAM User

1. Go to AWS IAM Console
2. Create user with programmatic access
3. Attach this inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

## 4. Update .env

```env
STORAGE_TYPE=s3
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
```

## 5. Restart Your App

```bash
pnpm run dev
```

That's it! Your app now uses S3 for storage.

## Optional: Add CloudFront CDN

1. Create CloudFront distribution pointing to your S3 bucket
2. Add to .env:

```env
AWS_CLOUDFRONT_DOMAIN=dxxxxx.cloudfront.net
```

## Need More Details?

See the complete [S3 Migration Guide](./s3-migration-guide.md) for:

- Detailed step-by-step instructions
- Cost optimization tips
- Security best practices
- Troubleshooting guide
- Migration scripts for existing files

## Rollback to Local Storage

Change one line in `.env`:

```env
STORAGE_TYPE=local
```

Restart and you're back to local storage!
