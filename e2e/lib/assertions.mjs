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

export function assertRootPackage(workspace, expectedName) {
  console.log('==> Verifying root package name...');

  const expectedPackageName = `@${expectedName}/source`;
  const packageJson = JSON.parse(readFileSync(path.join(workspace, 'package.json'), 'utf8'));

  if (packageJson.name !== expectedPackageName) {
    throw new Error(`Expected root package name "${expectedPackageName}", got "${packageJson.name}"`);
  }

  const tsconfig = JSON.parse(readFileSync(path.join(workspace, 'tsconfig.base.json'), 'utf8'));

  if (!tsconfig.compilerOptions?.customConditions?.includes(expectedPackageName)) {
    throw new Error(`Expected "customConditions" in tsconfig.base.json to include "${expectedPackageName}"`);
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

export function assertExpoAppDependenciesAligned(workspace, appDirectory, packageNames) {
  console.log('==> Verifying expo app dependencies alignment...');

  const appRoot = path.join(workspace, 'apps', appDirectory);
  const rootPackageJson = JSON.parse(readFileSync(path.join(workspace, 'package.json'), 'utf8'));
  const appPackageJson = JSON.parse(readFileSync(path.join(appRoot, 'package.json'), 'utf8'));
  const getDeclaredVersion = (packageJson, packageName) =>
    ({ ...packageJson.dependencies, ...packageJson.devDependencies })[packageName];

  for (const packageName of packageNames) {
    const rootVersion = getDeclaredVersion(rootPackageJson, packageName);
    const appVersion = getDeclaredVersion(appPackageJson, packageName);

    if (!rootVersion || !appVersion) {
      throw new Error(`Expected "${packageName}" to be declared in both root and ${appDirectory} package.json`);
    }

    if (rootVersion !== appVersion) {
      throw new Error(`Expected "${packageName}" versions to match: root has "${rootVersion}", app has "${appVersion}"`);
    }
  }

  const output = execSync(`npm ls ${packageNames.join(' ')} --all --json`, { cwd: workspace, encoding: 'utf8' });
  const installedVersions = new Map();

  const collectInstalledVersions = (node) => {
    for (const [packageName, dependency] of Object.entries(node.dependencies ?? {})) {
      if (packageNames.includes(packageName)) {
        const versions = installedVersions.get(packageName) ?? new Set();

        versions.add(dependency.version);
        installedVersions.set(packageName, versions);
      }

      collectInstalledVersions(dependency);
    }
  };

  collectInstalledVersions(JSON.parse(output));

  for (const packageName of packageNames) {
    const versions = [...(installedVersions.get(packageName) ?? [])];

    if (versions.length !== 1) {
      throw new Error(`Expected a single installed version of "${packageName}", got: ${versions.join(', ') || 'none'}`);
    }

    if (existsSync(path.join(appRoot, 'node_modules', packageName))) {
      throw new Error(
        `Expected "${packageName}" to be hoisted to the workspace root, but found a duplicate in apps/${appDirectory}/node_modules`,
      );
    }
  }

  execSync('npx expo install --check', { cwd: appRoot, stdio: 'inherit' });
}

export function assertEntityApi(workspace, appDirectory, entityName) {
  const entityPath = entityName.toLowerCase();

  console.log(`==> Verifying entity-api output for ${entityName}...`);

  assertPathExists(workspace, `libs/${appDirectory}/shared/data-access/api/src/lib/${entityPath}/api.ts`, 'file');
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

export function assertLintTargets(workspace, expectedProjects) {
  console.log('==> Verifying lint targets of generated libraries...');

  for (const project of expectedProjects) {
    const output = execSync(`npx nx show project ${project} --json`, { cwd: workspace, encoding: 'utf8' });
    const { targets } = JSON.parse(output);

    if (!targets?.lint) {
      throw new Error(`Expected nx project "${project}" to have a lint target`);
    }
  }
}
