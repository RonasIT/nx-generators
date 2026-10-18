import * as path from 'path';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  installPackagesTask,
  readJson,
  Tree,
  writeJson,
} from '@nx/devkit';
import { devDependencies } from '../../shared/dependencies';
import { defaultRootPackageName, getRootPackageName, getWorkspaceScope } from '../../shared/utils/config-utils';
import { formatName, getProjectName } from '../../shared/utils/format-utils';
import engines from './engines';
import { RepoConfigGeneratorSchema } from './schema';
import scripts from './scripts';

export async function repoConfigGenerator(tree: Tree, options: RepoConfigGeneratorSchema = {}) {
  const projectRoot = '.';
  const projectPackagePath = 'package.json';
  const tsconfigBasePath = 'tsconfig.base.json';

  const projectPackageJson = readJson<{
    name?: string;
    [key: string]: unknown;
  }>(tree, projectPackagePath);
  const currentPackageName = projectPackageJson.name;
  const scope = getWorkspaceScope(tree, options.name);
  const packageName =
    currentPackageName && !options.name && currentPackageName !== defaultRootPackageName
      ? currentPackageName
      : getRootPackageName(scope);

  // Remove unnecessary files and files that will be replaced
  tree.delete('README.md');
  tree.delete('AGENTS.md');
  tree.delete('packages');

  // Update project package.json
  projectPackageJson.name = packageName;
  projectPackageJson.workspaces = ['apps/*'];
  projectPackageJson.scripts = scripts;
  projectPackageJson.engines = engines;
  writeJson(tree, projectPackagePath, projectPackageJson);

  // Keep the TypeScript custom condition in sync with the package name
  if (tree.exists(tsconfigBasePath)) {
    const tsconfigJson = readJson<{ compilerOptions?: { customConditions?: Array<string> } }>(tree, tsconfigBasePath);
    const compilerOptions = tsconfigJson.compilerOptions;

    if (compilerOptions?.customConditions) {
      const previousPackageNames = [currentPackageName, defaultRootPackageName, getRootPackageName(scope)];
      const customConditions = compilerOptions.customConditions;
      const updatedCustomConditions = customConditions.map((condition) =>
        previousPackageNames.includes(condition) ? packageName : condition,
      );

      if (updatedCustomConditions.some((condition, index) => condition !== customConditions[index])) {
        compilerOptions.customConditions = updatedCustomConditions;
        writeJson(tree, tsconfigBasePath, tsconfigJson);
      }
    }
  }

  // Add project files
  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    name: getProjectName(packageName),
    formatName,
  });

  // Add dependencies
  addDependenciesToPackageJson(tree, {}, devDependencies['repo-config']);

  await formatFiles(tree);

  return (): void => {
    installPackagesTask(tree);
  };
}

export default repoConfigGenerator;
