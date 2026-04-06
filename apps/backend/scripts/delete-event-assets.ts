import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

/**
 * Delete all event assets from R2 bucket with prefix "public/assets/events/"
 * Uses inline Cloudflare R2 environment variables
 */
async function deleteEventAssets() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const publicBucket = process.env.R2_PUBLIC_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !publicBucket) {
    throw new Error('Missing required R2 environment variables');
  }

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const prefix = 'public/assets/events/';
  let continuationToken: string | undefined;
  let deletedCount = 0;

  // Configurable-parallelism for deletion batches
  const DELETE_CONCURRENCY = 10;

  console.log(`🗑️  Starting deletion of all objects under prefix: ${prefix}`);
  console.log(`📦 Bucket: ${publicBucket}`);

  try {
    // List all objects with the prefix
    while (true) {
      const listCommand = new ListObjectsV2Command({
        Bucket: publicBucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const listResult = await s3Client.send(listCommand);

      if (!listResult.Contents || listResult.Contents.length === 0) {
        console.log('✨ No more objects found');
        break;
      }

      console.log(
        `Found ${listResult.Contents.length} objects in this batch...`,
      );

      // Prepare all delete commands for objects in parallel
      const objectsToDelete = listResult.Contents.filter(obj => obj.Key);

      // Helper function to process batches of deletions with limited concurrency
      async function processDeleteBatches(objects, batchSize) {
        let index = 0;
        while (index < objects.length) {
          const batch = objects.slice(index, index + batchSize);
          // Fire off simultaneous delete requests for this batch
          await Promise.all(
            batch.map(async object => {
              const deleteCommand = new DeleteObjectCommand({
                Bucket: publicBucket,
                Key: object.Key,
              });
              await s3Client.send(deleteCommand);
              console.log(`  ✓ Deleted: ${object.Key}`);
              deletedCount++;
            }),
          );
          index += batchSize;
        }
      }

      await processDeleteBatches(objectsToDelete, DELETE_CONCURRENCY);

      // Check if there are more results
      if (listResult.IsTruncated && listResult.NextContinuationToken) {
        continuationToken = listResult.NextContinuationToken;
      } else {
        break;
      }
    }

    console.log(`\n✅ Successfully deleted ${deletedCount} objects`);
  } catch (error) {
    console.error('❌ Error deleting objects:', error);
    throw error;
  }
}

deleteEventAssets().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
