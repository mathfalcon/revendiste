/**
 * Post-build script to fix ~/shared import paths in compiled files
 *
 * tsc-alias doesn't correctly resolve paths that go outside the project directory,
 * so we manually fix them after tsc-alias runs.
 */
const fs = require('fs');
const path = require('path');

function getAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function fixPaths() {
  const distDir = path.resolve(__dirname, 'dist');

  if (!fs.existsSync(distDir)) {
    console.error('dist directory does not exist. Run tsc first.');
    process.exit(1);
  }

  // Find all .js files in dist
  const files = getAllJsFiles(distDir);
  let fixedCount = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    // Calculate relative path from this file to packages/shared/dist
    // Use dist for production builds, src for development
    const fileDir = path.dirname(file);
    const sharedDistPath = path.resolve(
      __dirname,
      '../../packages/shared/dist',
    );
    const sharedSrcPath = path.resolve(__dirname, '../../packages/shared/src');

    // Prefer dist if it exists (production build), otherwise use src (development)
    const sharedPath = fs.existsSync(sharedDistPath)
      ? sharedDistPath
      : sharedSrcPath;
    const relativePath = path.relative(fileDir, sharedPath).replace(/\\/g, '/');

    // Ensure path starts with ./ or ../ for relative imports
    const normalizedPath = relativePath.startsWith('.')
      ? relativePath
      : './' + relativePath;

    // Replace require("~/shared") with the correct relative path
    const requireRegex = /require\(['"]~\/shared['"]\)/g;
    content = content.replace(
      requireRegex,
      "require('" + normalizedPath + "')",
    );

    // Replace from '~/shared' with the correct relative path (for ESM if any)
    const fromRegex = /from ['"]~\/shared['"]/g;
    content = content.replace(fromRegex, "from '" + normalizedPath + "'");

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      fixedCount++;
      console.log('Fixed paths in: ' + path.relative(distDir, file));
    }
  }

  if (fixedCount > 0) {
    console.log('\nFixed ' + fixedCount + ' file(s)');
  }
}

fixPaths();
