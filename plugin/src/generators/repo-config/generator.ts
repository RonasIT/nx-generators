import { execSync } from 'child_process';
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
import scripts from './scripts';
import { formatName, getProjectName } from '../../shared';

export async function repoConfigGenerator(tree: Tree) {
  const projectRoot = '.';
  const projectPackagePath = 'package.json';

  // Remove unnecessary files and files that will be replaced
  tree.delete('README.md');

  // Update project package.json
  const projectPackageJson = readJson(tree, projectPackagePath);
  projectPackageJson.workspaces = ['apps/*'];
  projectPackageJson.scripts = { ...scripts, ...projectPackageJson.scripts };
  writeJson(tree, projectPackagePath, projectPackageJson);

  // Add project files
  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    name: getProjectName(projectPackageJson.name),
    formatName,
  });

  // Add dependencies
  addDependenciesToPackageJson(tree, {}, { syncpack: '^12.3.0' });

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
    execSync('npx expo install --fix', { stdio: 'inherit' });
  };
}

export default repoConfigGenerator;
