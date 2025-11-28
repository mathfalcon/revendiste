import {VITE_APP_API_URL} from '~/config/env';

// Helper function to check if a file is an image based on MIME type
export function isImageFile(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith('image/');
}

// Helper function to construct full file URL
// If URL is relative (starts with /), prepend API base URL
// Otherwise, use as-is (for S3 URLs)
export function getFullFileUrl(url: string): string {
  if (url.startsWith('/')) {
    // Relative path - prepend API base URL
    const apiBase = VITE_APP_API_URL.replace('/api', ''); // Remove /api suffix
    return `${apiBase}${url}`;
  }
  // Absolute URL (e.g., S3) - use as-is
  return url;
}

