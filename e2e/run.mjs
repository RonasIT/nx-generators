import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const workDir = path.join(repoRoot, 'e2e', '.workspace');
const e2eWorkspace = path.join(workDir, 'e2e-workspace');

process.env.NX_NON_INTERACTIVE = 'true';
process.env.npm_config_yes = 'true';

function run(command, options = {}) {
  execSync(command, { stdio: 'inherit', ...options });
}

function assertDirectory(dirPath) {
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
    throw new Error(`Expected directory: ${dirPath}`);
  }
}

try {
  console.log(`==> Preparing E2E workspace at ${workDir}...`);
  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });

  console.log('==> Building package...');
  run('npm run build', { cwd: repoRoot });

  console.log('==> Publishing to Yalc...');
  run('npx yalc publish', { cwd: path.join(repoRoot, 'dist', 'nx-generators') });

  console.log(`==> Creating consumer workspace in ${workDir}...`);
  run(
    'npx create-nx-workspace e2e-workspace --preset=ts --formatter=prettier --ci=skip --interactive=false --packageManager=npm',
    { cwd: workDir },
  );

  console.log('==> Installing @ronas-it/nx-generators via Yalc...');
  run('npx yalc add @ronas-it/nx-generators', { cwd: e2eWorkspace });
  run('npm install', { cwd: e2eWorkspace });

  console.log('==> Running repo-config and code-checks...');
  run('npx nx g repo-config --no-interactive', { cwd: e2eWorkspace });
  run('npx nx g code-checks --no-interactive', { cwd: e2eWorkspace });

  console.log('==> Generating expo-app...');
  run(
    'npx nx g expo-app my-app mobile --no-interactive --withStore --withUiKit --withFormUtils --withApiClient --withAuth',
    { cwd: e2eWorkspace },
  );

  console.log('==> Generating next-app...');
  run('npx nx g next-app my-app web --no-interactive --withStore --withFormUtils --withApiClient --withAuth --withNuqs', {
    cwd: e2eWorkspace,
  });

  console.log('==> Verifying generated apps...');
  assertDirectory(path.join(e2eWorkspace, 'apps', 'mobile'));
  assertDirectory(path.join(e2eWorkspace, 'apps', 'web'));

  console.log('==> Running lint...');
  run('npm run lint', { cwd: e2eWorkspace });

  console.log('==> Running npm audit...');
  run('npm audit --audit-level=critical', { cwd: e2eWorkspace });

  console.log('==> E2E passed.');
} finally {
  console.log(`==> Workspace kept at: ${e2eWorkspace}`);
}
