import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const WORK_DIR = path.join(REPO_ROOT, 'e2e', '.workspace');
const E2E_WORKSPACE = path.join(WORK_DIR, 'e2e-workspace');

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
  console.log(`==> Preparing E2E workspace at ${WORK_DIR}...`);
  rmSync(WORK_DIR, { recursive: true, force: true });
  mkdirSync(WORK_DIR, { recursive: true });

  console.log('==> Building package...');
  run('npm run build', { cwd: REPO_ROOT });

  console.log('==> Publishing to Yalc...');
  run('npx yalc publish', { cwd: path.join(REPO_ROOT, 'dist', 'nx-generators') });

  console.log(`==> Creating consumer workspace in ${WORK_DIR}...`);
  run(
    'npx create-nx-workspace e2e-workspace --preset=ts --formatter=prettier --ci=skip --interactive=false --packageManager=npm',
    { cwd: WORK_DIR },
  );

  console.log('==> Installing @ronas-it/nx-generators via Yalc...');
  run('npx yalc add @ronas-it/nx-generators', { cwd: E2E_WORKSPACE });
  run('npm install', { cwd: E2E_WORKSPACE });

  console.log('==> Running repo-config and code-checks...');
  run('npx nx g repo-config --no-interactive', { cwd: E2E_WORKSPACE });
  run('npx nx g code-checks --no-interactive', { cwd: E2E_WORKSPACE });

  console.log('==> Generating expo-app...');
  run(
    'npx nx g expo-app my-app mobile --no-interactive --withStore --withUiKit --withFormUtils --withApiClient --withAuth',
    { cwd: E2E_WORKSPACE },
  );

  console.log('==> Generating next-app...');
  run('npx nx g next-app my-app web --no-interactive --withStore --withFormUtils --withApiClient --withAuth', {
    cwd: E2E_WORKSPACE,
  });

  console.log('==> Verifying generated apps...');
  assertDirectory(path.join(E2E_WORKSPACE, 'apps', 'mobile'));
  assertDirectory(path.join(E2E_WORKSPACE, 'apps', 'web'));

  console.log('==> Running lint...');
  run('npm run lint', { cwd: E2E_WORKSPACE });

  console.log('==> E2E passed.');
} finally {
  console.log(`==> Workspace kept at: ${E2E_WORKSPACE}`);
}
