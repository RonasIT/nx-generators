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
import { devDependencies } from '../../dependencies';
import scripts from './scripts';
import { formatName, getProjectName } from '../../shared/utils';

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
  addDependenciesToPackageJson(tree, {}, devDependencies['repo-config']);

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
  };
}

export default repoConfigGenerator;
