import {readFileSync, writeFileSync} from 'fs';
import {join} from 'path';

/**
 * Cleans up Generated<> wrappers from the db.d.ts file
 * This is needed because TSOA has issues resolving Generated<> types into proper Swagger JSON
 */
export function cleanDbTypes(): void {
  try {
    const filePath = join(__dirname, '../types/db.d.ts');
    let content = readFileSync(filePath, 'utf8');

    // Remove all Generated<> wrappers, keeping only the inner type
    content = content.replace(/Generated<([^>]+)>/g, '$1');

    writeFileSync(filePath, content, 'utf8');
    console.log('✅ Successfully cleaned Generated<> wrappers from db.d.ts');
  } catch (error) {
    console.error('❌ Error cleaning db.d.ts file:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  cleanDbTypes();
}
