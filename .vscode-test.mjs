import { defineConfig } from '@vscode/test-cli';
import { existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Ensure .env file exists for tests
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '.env');
if (!existsSync(envPath)) {
  writeFileSync(envPath, 'HELLO=World\n');
}

export default defineConfig({
  files: 'test/suite/**/*.test.js',
  mocha: {
    ui: 'bdd',
    timeout: 20000
  }
});
