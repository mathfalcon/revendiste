import {FileText, Image, File} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';

/**
 * Get the appropriate icon for a file based on its MIME type
 */
export function getFileIcon(mimeType: string): LucideIcon {
  if (mimeType.startsWith('image/')) {
    return Image;
  }
  if (mimeType === 'application/pdf') {
    return FileText;
  }
  return File;
}

/**
 * Get a human-readable file type label
 */
export function getFileTypeLabel(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    return 'Imagen';
  }
  if (mimeType === 'application/pdf') {
    return 'PDF';
  }
  return 'Archivo';
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

