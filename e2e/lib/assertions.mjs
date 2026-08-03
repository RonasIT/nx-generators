import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export function assertPathExists(workspace, relativePath, type = 'any') {
  const fullPath = path.join(workspace, relativePath);

  if (!existsSync(fullPath)) {
    throw new Error(`Expected ${type} to exist: ${relativePath}`);
  }

  if (type === 'directory' && !statSync(fullPath).isDirectory()) {
    throw new Error(`Expected directory: ${relativePath}`);
  }

  if (type === 'file' && !statSync(fullPath).isFile()) {
    throw new Error(`Expected file: ${relativePath}`);
  }
}

export function assertFileContains(workspace, relativePath, substring) {
  assertPathExists(workspace, relativePath, 'file');
  const content = readFileSync(path.join(workspace, relativePath), 'utf8');

  if (!content.includes(substring)) {
    throw new Error(`Expected ${relativePath} to contain "${substring}"`);
  }
}

export function assertFullWorkspaceStructure(workspace) {
  console.log('==> Verifying generated workspace structure...');

  assertPathExists(workspace, 'apps/mobile/app.config.ts', 'file');
  assertPathExists(workspace, 'apps/web/app/[locale]/layout.tsx', 'file');

  assertPathExists(workspace, 'libs/mobile/shared/data-access/store', 'directory');
  assertPathExists(workspace, 'libs/mobile/shared/data-access/api-client', 'directory');
  assertPathExists(workspace, 'libs/mobile/shared/data-access/auth', 'directory');

  assertPathExists(workspace, 'libs/web/shared/data-access/store', 'directory');
  assertPathExists(workspace, 'libs/web/shared/data-access/api-client', 'directory');
  assertPathExists(workspace, 'libs/web/shared/data-access/auth', 'directory');

  assertFileContains(workspace, '.npmrc', 'min-release-age=3');
  assertPathExists(workspace, 'eslint.constraints.json', 'file');

  assertPathExists(workspace, '.prettierrc.js', 'file');
  assertPathExists(workspace, 'eslint.config.cjs', 'file');

  const packageJson = JSON.parse(readFileSync(path.join(workspace, 'package.json'), 'utf8'));

  if (!packageJson.scripts?.lint) {
    throw new Error('Expected package.json scripts to include lint');
  }

  assertFileContains(workspace, 'apps/web/app/[locale]/providers.tsx', 'NuqsAdapter');
  assertFileContains(workspace, 'apps/web/app/[locale]/providers.tsx', '@mantine/core');
}

export function assertEntityApi(workspace, appDirectory, entityName) {
  const entityPath = entityName.toLowerCase();

  console.log(`==> Verifying entity-api output for ${entityName}...`);

  assertPathExists(
    workspace,
    `libs/${appDirectory}/shared/data-access/api/src/lib/${entityPath}/api.ts`,
    'file',
  );
  assertPathExists(
    workspace,
    `libs/${appDirectory}/shared/data-access/api/src/lib/${entityPath}/models/${entityPath}.ts`,
    'file',
  );
}

export function assertDockerfile(workspace) {
  console.log('==> Verifying dockerfile output...');
  assertPathExists(workspace, 'Dockerfile', 'file');
}

export function assertNxProjects(workspace, expectedProjects) {
  console.log('==> Verifying Nx project graph...');

  const output = execSync('npx nx show projects', { cwd: workspace, encoding: 'utf8' });

  for (const project of expectedProjects) {
    if (!output.includes(project)) {
      throw new Error(`Expected nx project "${project}" in:\n${output}`);
    }
  }
}
