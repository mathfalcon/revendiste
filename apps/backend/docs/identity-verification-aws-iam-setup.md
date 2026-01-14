# AWS IAM Configuration for Identity Verification

This document provides instructions for configuring AWS IAM policies and R2 access for the identity verification system.

## Required Services

1. **AWS Rekognition** - Face liveness detection, face comparison, and text detection
2. **Cloudflare R2** - Encrypted storage for document images (S3-compatible)

## AWS IAM Policy for Rekognition

Create an IAM user or role with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RekognitionIdentityVerification",
      "Effect": "Allow",
      "Action": [
        "rekognition:DetectText",
        "rekognition:DetectFaces",
        "rekognition:CompareFaces",
        "rekognition:CreateFaceLivenessSession",
        "rekognition:GetFaceLivenessSessionResults",
        "rekognition:StartFaceLivenessSession"
      ],
      "Resource": "*"
    }
  ]
}
```

### Steps to Create IAM User

1. Go to AWS IAM Console
2. Click "Users" → "Add users"
3. Enter username: `revendiste-identity-verification`
4. Select "Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach policies directly"
7. Click "Create policy"
8. Paste the JSON policy above
9. Name the policy: `RevendisteIdentityVerificationPolicy`
10. Attach the policy to the user
11. Download the access keys (Access Key ID and Secret Access Key)

### Environment Variables

Add the following to your `.env` file:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
```

## Cloudflare R2 Configuration

### Create R2 Bucket

1. Go to Cloudflare Dashboard → R2
2. Create two buckets:
   - `revendiste-public` (for public assets)
   - `revendiste-private` (for identity documents)
3. Configure CORS for the private bucket:

```json
[
  {
    "AllowedOrigins": ["https://revendiste.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### Create R2 API Token

1. Go to R2 → Manage R2 API Tokens
2. Click "Create API Token"
3. Name: `revendiste-identity-verification`
4. Permissions: "Read & Write"
5. Buckets: Select both buckets
6. Copy the following values:
   - Access Key ID
   - Secret Access Key
   - Account ID

### Environment Variables for R2

Add the following to your `.env` file:

```bash
R2_PUBLIC_BUCKET=revendiste-public
R2_PRIVATE_BUCKET=revendiste-private
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_CDN_DOMAIN=your_cdn_domain.r2.dev  # Optional
R2_SIGNED_URL_EXPIRY=900  # 15 minutes
```

## AWS Rekognition Liveness Output to R2

AWS Rekognition can write liveness output directly to R2 using the S3-compatible API. The backend service is already configured to use the R2 private bucket for liveness output:

```typescript
OutputConfig: {
  S3Bucket: R2_PRIVATE_BUCKET,
  S3KeyPrefix: `private/users/${userId}/liveness-output/`,
}
```

## Security Best Practices

### 1. Principle of Least Privilege

- Only grant the minimum permissions required
- Use separate IAM users for different services
- Rotate access keys regularly (every 90 days)

### 2. Encryption

- **R2 Encryption**: All objects in R2 are automatically encrypted at rest with AES-256-GCM
- **Transit Encryption**: All data is encrypted in transit with TLS 1.3+
- **Signed URLs**: Use short-lived signed URLs (15 minutes) for private document access

### 3. Access Control

- R2 buckets should not be publicly accessible
- Use signed URLs for temporary access to private documents
- Implement IP whitelisting for admin access if needed

### 4. Audit Logging

- Enable CloudTrail for AWS API calls
- Enable R2 access logs for compliance tracking
- Log all identity verification attempts and results

### 5. Data Retention

- Identity documents: 5 years (compliance requirement)
- Liveness biometric data: Delete immediately after verification
- Verification metadata: Retain as audit trail

## Cost Estimates

### AWS Rekognition Pricing (us-east-1)

- Text Detection: $0.001 per image
- Face Detection: $0.001 per image
- Face Comparison: $0.001 per comparison
- Face Liveness: $0.10 per session

**Per verification cost**: ~$0.104

With $1,000 AWS credits, you can perform approximately 9,600 verifications.

### Cloudflare R2 Pricing

- Storage: $0.015 per GB/month
- Class A Operations (writes): $4.50 per million
- Class B Operations (reads): $0.36 per million
- Egress: Free

## Testing

### Test in Development

1. Use a test document image (CI Uruguay with valid checksum)
2. Use a test selfie image
3. Mock the liveness check in development
4. Verify documents are uploaded to R2
5. Check AWS Rekognition API calls in CloudTrail

### Production Verification

1. Test with a real CI Uruguay document
2. Complete liveness check on mobile device
3. Verify the complete flow from initiation to completion
4. Check verification status in database
5. Verify audit logs are created

## Monitoring

Set up CloudWatch alarms for:

- Rekognition API errors
- High API costs
- Failed verification attempts
- R2 upload failures

## Troubleshooting

### Common Issues

1. **Rekognition API errors**: Check IAM permissions and region
2. **R2 upload fails**: Verify API tokens and bucket names
3. **Liveness session creation fails**: Check OutputConfig bucket access
4. **Low confidence scores**: Check image quality requirements

### Debug Commands

```bash
# Test AWS credentials
aws sts get-caller-identity

# List R2 buckets (using S3 API)
aws s3 ls --endpoint-url https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com

# Test Rekognition
aws rekognition detect-text --image "S3Object={Bucket=my-bucket,Name=test.jpg}"
```

## References

- [AWS Rekognition Documentation](https://docs.aws.amazon.com/rekognition/)
- [AWS Rekognition Face Liveness](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/)
