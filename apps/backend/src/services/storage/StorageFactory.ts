import path from 'path';
import {
  STORAGE_TYPE,
  STORAGE_LOCAL_PATH,
  STORAGE_BASE_URL,
  AWS_S3_BUCKET,
  AWS_S3_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_CLOUDFRONT_DOMAIN,
  AWS_S3_SIGNED_URL_EXPIRY,
  R2_PUBLIC_BUCKET,
  R2_PRIVATE_BUCKET,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_CDN_DOMAIN,
  R2_SIGNED_URL_EXPIRY,
} from '~/config/env';
import {LocalStorageProvider} from './LocalStorageProvider';
import {S3StorageProvider} from './S3StorageProvider';
import {R2StorageProvider} from './R2StorageProvider';
import type {IStorageProvider} from './IStorageProvider';

/**
 * Storage Factory
 *
 * Creates and returns the appropriate storage provider based on configuration.
 * This allows us to easily switch between local storage and cloud storage (S3, etc.)
 * without changing the application code.
 */
class StorageFactory {
  private static instance: IStorageProvider | null = null;

  /**
   * Get the storage provider instance (singleton)
   */
  static getProvider(): IStorageProvider {
    if (!this.instance) {
      this.instance = this.createProvider();
    }
    return this.instance;
  }

  /**
   * Create a new storage provider based on configuration
   */
  private static createProvider(): IStorageProvider {
    switch (STORAGE_TYPE) {
      case 'local':
        return this.createLocalProvider();

      case 's3':
        return this.createS3Provider();

      case 'r2':
        return this.createR2Provider();

      default:
        throw new Error(`Unsupported storage type: ${STORAGE_TYPE}`);
    }
  }

  /**
   * Create local file system storage provider
   */
  private static createLocalProvider(): LocalStorageProvider {
    // Resolve the storage path relative to the project root
    const baseDir = path.resolve(process.cwd(), STORAGE_LOCAL_PATH);

    return new LocalStorageProvider(baseDir, STORAGE_BASE_URL);
  }

  /**
   * Create AWS S3 storage provider
   */
  private static createS3Provider(): S3StorageProvider {
    // Validate required S3 configuration
    if (!AWS_S3_BUCKET) {
      throw new Error(
        'AWS_S3_BUCKET is required when STORAGE_TYPE is set to "s3"',
      );
    }
    if (!AWS_S3_REGION) {
      throw new Error(
        'AWS_S3_REGION is required when STORAGE_TYPE is set to "s3"',
      );
    }
    if (!AWS_ACCESS_KEY_ID) {
      throw new Error(
        'AWS_ACCESS_KEY_ID is required when STORAGE_TYPE is set to "s3"',
      );
    }
    if (!AWS_SECRET_ACCESS_KEY) {
      throw new Error(
        'AWS_SECRET_ACCESS_KEY is required when STORAGE_TYPE is set to "s3"',
      );
    }

    return new S3StorageProvider({
      bucket: AWS_S3_BUCKET,
      region: AWS_S3_REGION,
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      cloudFrontDomain: AWS_CLOUDFRONT_DOMAIN,
      signedUrlExpiry: AWS_S3_SIGNED_URL_EXPIRY,
    });
  }

  /**
   * Create Cloudflare R2 storage provider
   */
  private static createR2Provider(): R2StorageProvider {
    // Validate required R2 configuration
    if (!R2_PUBLIC_BUCKET) {
      throw new Error(
        'R2_PUBLIC_BUCKET is required when STORAGE_TYPE is set to "r2"',
      );
    }
    if (!R2_PRIVATE_BUCKET) {
      throw new Error(
        'R2_PRIVATE_BUCKET is required when STORAGE_TYPE is set to "r2"',
      );
    }
    if (!R2_ACCOUNT_ID) {
      throw new Error(
        'R2_ACCOUNT_ID is required when STORAGE_TYPE is set to "r2"',
      );
    }
    if (!R2_ACCESS_KEY_ID) {
      throw new Error(
        'R2_ACCESS_KEY_ID is required when STORAGE_TYPE is set to "r2"',
      );
    }
    if (!R2_SECRET_ACCESS_KEY) {
      throw new Error(
        'R2_SECRET_ACCESS_KEY is required when STORAGE_TYPE is set to "r2"',
      );
    }

    return new R2StorageProvider({
      publicBucket: R2_PUBLIC_BUCKET,
      privateBucket: R2_PRIVATE_BUCKET,
      accountId: R2_ACCOUNT_ID,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      cdnDomain: R2_CDN_DOMAIN,
      signedUrlExpiry: R2_SIGNED_URL_EXPIRY,
    });
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}

// Export a convenient function to get the storage provider
export const getStorageProvider = (): IStorageProvider => {
  return StorageFactory.getProvider();
};
