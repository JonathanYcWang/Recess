// Post-build script to compile and copy background and content scripts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const buildScripts = async () => {
  try {
    console.log('Compiling background script...');

    // Use TypeScript compiler to compile the service worker script.
    await execAsync(
      'npx tsc src/background.ts --outDir dist --target ES2020 --module ESNext --skipLibCheck --moduleResolution bundler --esModuleInterop'
    );

    console.log('✓ Background script compiled successfully');
  } catch (error) {
    console.error('Error compiling scripts:', error);
    process.exit(1);
  }
};

buildScripts();
