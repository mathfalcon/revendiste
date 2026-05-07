import {existsSync} from 'node:fs';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const brandRoot = join(__dirname, '../../brand');

type Manifest = {
  logos: Record<string, {path: string; raster?: string}>;
  backgrounds: Record<string, {path: string}>;
  fonts: Record<string, {path: string; weight?: number}>;
  audio: Record<string, {path: string}>;
  references: Array<{path: string; tags?: string[]}>;
  products: Array<{path: string; label?: string}>;
};

let manifestCache: Manifest | null = null;

function loadManifest(): Manifest {
  if (!manifestCache) {
    const raw = readFileSync(join(brandRoot, 'manifest.json'), 'utf-8');
    manifestCache = JSON.parse(raw) as Manifest;
  }
  return manifestCache;
}

/** Absolute path to a brand file (for Node / Satori / CLI). */
export function brandAssetPath(
  category: 'logos' | 'backgrounds' | 'fonts' | 'audio',
  key: string,
  variant: 'default' | 'raster' = 'default',
): string {
  const m = loadManifest();
  if (category === 'logos') {
    const entry = m.logos[key];
    if (!entry) {
      throw new Error(`Unknown logo key: ${key}`);
    }
    const rel =
      variant === 'raster' && entry.raster ? entry.raster : entry.path;
    return join(brandRoot, rel);
  }
  if (category === 'backgrounds') {
    const entry = m.backgrounds[key];
    if (!entry) {
      throw new Error(`Unknown background key: ${key}`);
    }
    return join(brandRoot, entry.path);
  }
  if (category === 'fonts') {
    const entry = m.fonts[key];
    if (!entry) {
      throw new Error(`Unknown font key: ${key}`);
    }
    return join(brandRoot, entry.path);
  }
  const entry = m.audio[key];
  if (!entry) {
    throw new Error(`Unknown audio key: ${key}`);
  }
  return join(brandRoot, entry.path);
}

export function brandAssetExists(path: string): boolean {
  return existsSync(path);
}

export function brandReferences(filter?: {tags?: string[]}): string[] {
  const m = loadManifest();
  let refs = m.references ?? [];
  if (filter?.tags?.length) {
    refs = refs.filter(r => filter.tags!.some(t => r.tags?.includes(t)));
  }
  return refs.map(r => join(brandRoot, r.path)).filter(brandAssetExists);
}

export function brandRootPath(): string {
  return brandRoot;
}
