import { accessSync } from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const requiredArtifacts = ['manifest.json', 'index.html'];

for (const artifact of requiredArtifacts) {
  accessSync(path.join(distDir, artifact));
}

console.log(`Chromium extension packaged at ${distDir}`);
