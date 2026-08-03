import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import {
  assertDockerfile,
  assertEntityApi,
  assertFullWorkspaceStructure,
  assertNxProjects,
} from '../lib/assertions.mjs';

export function runFullWorkspaceScenario({ repoRoot, workDir, e2eWorkspace, run }) {
  console.log(`==> Preparing E2E workspace at ${workDir}...`);
  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });

  run('npm run build', { cwd: repoRoot });

  run('npx yalc publish', { cwd: path.join(repoRoot, 'dist', 'nx-generators') });

  run(
    'npx create-nx-workspace e2e-workspace --preset=ts --formatter=prettier --ci=skip --interactive=false --packageManager=npm',
    { cwd: workDir },
  );

  run('npx yalc add @ronas-it/nx-generators', { cwd: e2eWorkspace });
  run('npm install', { cwd: e2eWorkspace });

  run('npx nx g repo-config --no-interactive', { cwd: e2eWorkspace });
  run('npx nx g code-checks --no-interactive', { cwd: e2eWorkspace });

  run(
    'npx nx g expo-app my-app mobile --no-interactive --withStore --withUiKit --withFormUtils --withApiClient --withAuth',
    { cwd: e2eWorkspace },
  );

  run('npx nx g entity-api User --baseEndpoint=/users --no-interactive', { cwd: e2eWorkspace });
  assertEntityApi(e2eWorkspace, 'mobile', 'user');

  run(
    'npx nx g next-app my-app web --no-interactive --withStore --withFormUtils --withApiClient --withAuth --withNuqs --withMantine',
    { cwd: e2eWorkspace },
  );

  run('npx nx g dockerfile --no-interactive', { cwd: e2eWorkspace });
  assertDockerfile(e2eWorkspace);

  assertFullWorkspaceStructure(e2eWorkspace);

  assertNxProjects(e2eWorkspace, [
    'mobile',
    'web',
    'mobile/shared/data-access/store',
    'mobile/shared/data-access/api-client',
    'mobile/shared/data-access/auth',
    'web/shared/data-access/store',
    'web/shared/data-access/api-client',
    'web/shared/data-access/auth',
  ]);

  run('npm run lint', { cwd: e2eWorkspace });
  run('npm audit --audit-level=critical', { cwd: e2eWorkspace });
}
