import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLastCommand, run, setupEnv } from './lib/run-command.mjs';
import { runFullWorkspaceScenario } from './scenarios/full-workspace.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const workDir = path.join(repoRoot, 'e2e', '.workspace');
const e2eWorkspace = path.join(workDir, 'e2e-workspace');

setupEnv();

try {
  runFullWorkspaceScenario({ repoRoot, workDir, e2eWorkspace, run });
  console.log('==> E2E passed.');
} catch (error) {
  console.error(`==> E2E failed.`);
  console.error(`==> Workspace: ${e2eWorkspace}`);

  if (getLastCommand()) {
    console.error(`==> Last command: ${getLastCommand()}`);
  }

  try {
    const packageJson = JSON.parse(readFileSync(path.join(e2eWorkspace, 'package.json'), 'utf8'));
    console.error('==> Root package.json dependencies:', JSON.stringify(packageJson.dependencies, null, 2));
  } catch {
    // workspace may not exist yet
  }

  throw error;
} finally {
  console.log(`==> Workspace kept at: ${e2eWorkspace}`);
}
