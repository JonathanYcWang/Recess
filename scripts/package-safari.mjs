import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';

if (process.platform !== 'darwin') {
  console.error('Safari packaging requires macOS with Xcode.');
  process.exit(1);
}

const distDir = path.resolve('dist');
const outputDir = path.resolve('build/safari');

if (existsSync(outputDir)) {
  rmSync(outputDir, { recursive: true, force: true });
}

execSync(
  [
    'xcrun',
    'safari-web-extension-converter',
    `"${distDir}"`,
    '--project-location',
    `"${outputDir}"`,
    '--app-name',
    'Recess',
    '--macos-only',
    '--copy-resources',
    '--no-prompt',
    '--force',
    '--no-open',
  ].join(' '),
  { stdio: 'inherit' }
);

console.log(`Safari Xcode project generated at ${outputDir}`);
