import {GetObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';

function client(): S3Client {
  const endpoint = process.env.MARKETING_S3_ENDPOINT ?? 'http://127.0.0.1:9000';
  const region = process.env.MARKETING_S3_REGION ?? 'us-east-1';
  const accessKeyId = process.env.MARKETING_S3_ACCESS_KEY ?? 'minioadmin';
  const secretAccessKey = process.env.MARKETING_S3_SECRET_KEY ?? 'minioadmin';
  const forcePathStyle =
    (process.env.MARKETING_S3_FORCE_PATH_STYLE ?? 'true') === 'true';

  return new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: {accessKeyId, secretAccessKey},
  });
}

export function marketingBucket(): string {
  return process.env.MARKETING_S3_BUCKET ?? 'revendiste-marketing';
}

export async function putMarketingObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await client().send(
    new PutObjectCommand({
      Bucket: marketingBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getMarketingObjectSignedUrl(
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: marketingBucket(),
    Key: key,
  });
  return getSignedUrl(client(), cmd, {expiresIn: expiresInSeconds});
}
