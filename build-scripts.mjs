// Post-build script to bundle background and content scripts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const buildScripts = async () => {
  try {
    console.log('Bundling background script...');

    await execAsync('npx vite build --config vite.background.config.ts');

    console.log('✓ Background script bundled successfully');
  } catch (error) {
    console.error('Error compiling scripts:', error);
    process.exit(1);
  }
};

buildScripts();
