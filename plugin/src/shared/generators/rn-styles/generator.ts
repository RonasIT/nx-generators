import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  Tree,
} from '@nx/devkit';
import { dependencies } from '../../dependencies';
import { formatName, formatAppIdentifier } from '../../utils';

export async function runRNStylesGenerator(
  tree: Tree,
  options: { name: string; directory: string },
) {
  const appRoot = `apps/${options.directory}`;
  const libRoot = `libs/${options.directory}`;
  const libPath = `@${options.name}/${options.directory}`;

  // Generate shared libs
  execSync(`npx nx g react-lib ${options.directory}/shared/ui/styles`, {
    stdio: 'inherit',
  });

  const appPackagePath = `${appRoot}/package.json`;

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${libRoot}/shared/ui/styles/src/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, 'lib-files'), libRoot, {
    ...options,
    formatName,
    formatAppIdentifier,
    formatDirectory: () => libPath,
  });

  // Add dependencies
  addDependenciesToPackageJson(tree, dependencies['rn-styles'], {});

  if (existsSync(appPackagePath)) {
    addDependenciesToPackageJson(tree, dependencies['rn-styles'], {}, appPackagePath);
  }

  await formatFiles(tree);
}

export default runRNStylesGenerator;
