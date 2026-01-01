// Post-build script to compile and copy background and content scripts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function buildScripts() {
  try {
    console.log('Compiling background and content scripts...');

    // Use TypeScript compiler to compile the service worker scripts
    await execAsync(
      'npx tsc src/background.ts src/content.ts --outDir dist --target ES2020 --module ESNext --skipLibCheck --moduleResolution bundler --esModuleInterop'
    );

    console.log('✓ Background and content scripts compiled successfully');
  } catch (error) {
    console.error('Error compiling scripts:', error);
    process.exit(1);
  }
}

buildScripts();
