import path from 'path';
import {
  STORAGE_TYPE,
  STORAGE_LOCAL_PATH,
  STORAGE_BASE_URL,
  R2_PUBLIC_BUCKET,
  R2_PRIVATE_BUCKET,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_CDN_DOMAIN,
  R2_SIGNED_URL_EXPIRY,
} from '~/config/env';
import {LocalStorageProvider} from './LocalStorageProvider';
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

    // Ensure baseUrl includes /uploads to match the server static route
    // If baseUrl already ends with /uploads, use it as-is; otherwise append it
    const baseUrl = STORAGE_BASE_URL.endsWith('/uploads')
      ? STORAGE_BASE_URL
      : STORAGE_BASE_URL.endsWith('/')
        ? `${STORAGE_BASE_URL}uploads`
        : `${STORAGE_BASE_URL}/uploads`;

    return new LocalStorageProvider(baseDir, baseUrl);
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
