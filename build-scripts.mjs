// Post-build script: bundles background script and syncs Codex agent configs.
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { syncCodexAgents } from './scripts/sync-codex-agents.mjs';

const execAsync = promisify(exec);

const buildScripts = async () => {
  try {
    console.log('Bundling background script...');

    await execAsync('npx vite build --config vite.background.config.ts');

    console.log('✓ Background script bundled successfully');

    console.log('Syncing Codex agent configs...');
    syncCodexAgents();
  } catch (error) {
    console.error('Error compiling scripts:', error);
    process.exit(1);
  }
};

buildScripts();
