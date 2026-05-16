/**
 * Remove stale .next/dev output when switching from Turbopack to Webpack.
 * Turbopack panics left mixed chunks that trigger ChunkLoadError in the browser.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const nextDir = path.join(root, '.next');
const devDir = path.join(nextDir, 'dev');
const chunksDir = path.join(devDir, 'static', 'chunks');

function dirHasTurbopackChunks() {
  if (!fs.existsSync(chunksDir)) return false;
  try {
    return fs.readdirSync(chunksDir).some((name) => name.includes('turbopack'));
  } catch {
    return false;
  }
}

if (dirHasTurbopackChunks()) {
  fs.rmSync(devDir, { recursive: true, force: true });
  console.log('[clean-dev-cache] Removed .next/dev (stale Turbopack chunks).');
}
