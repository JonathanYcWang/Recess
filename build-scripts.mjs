// Post-build script to compile and copy background and content scripts
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildScripts() {
  try {
    // Compile TypeScript files to JavaScript
    console.log('Compiling background and content scripts...');

    // Read the TypeScript files
    const backgroundTS = readFileSync(join(__dirname, 'src', 'background.ts'), 'utf-8');
    const contentTS = readFileSync(join(__dirname, 'src', 'content.ts'), 'utf-8');

    // Simple TypeScript to JavaScript conversion (remove type annotations)
    const backgroundJS = backgroundTS
      .replace(/:\s*\w+(\[\])?(\s*\|\s*\w+)*\s*(?=[,;=)\n])/g, '') // Remove type annotations
      .replace(/as\s+\w+(\[\])?(\s*\|\s*\w+)*/g, '') // Remove 'as' type assertions
      .replace(/interface\s+\w+\s*{[^}]*}/gs, '') // Remove interface declarations
      .replace(/type\s+\w+\s*=\s*[^;]+;/gs, '') // Remove type aliases
      .replace(/\/\/\s*.*$/gm, '') // Remove single-line comments
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Clean up extra blank lines
      .trim();

    const contentJS = contentTS
      .replace(/:\s*\w+(\[\])?(\s*\|\s*\w+)*\s*(?=[,;=)\n])/g, '')
      .replace(/as\s+\w+(\[\])?(\s*\|\s*\w+)*/g, '')
      .replace(/interface\s+\w+\s*{[^}]*}/gs, '')
      .replace(/type\s+\w+\s*=\s*[^;]+;/gs, '')
      .replace(/\/\/\s*.*$/gm, '')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();

    // Write to dist folder
    writeFileSync(join(__dirname, 'dist', 'background.js'), backgroundJS + '\n');
    writeFileSync(join(__dirname, 'dist', 'content.js'), contentJS + '\n');

    console.log('✓ Background and content scripts compiled successfully');
  } catch (error) {
    console.error('Error processing scripts:', error);
    process.exit(1);
  }
}

buildScripts();
