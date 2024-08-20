import { execSync } from 'child_process';
import * as path from 'path';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  Tree
} from '@nx/devkit';
import { dependencies, devDependencies } from '../../dependencies';
import { LibraryPresetType } from '../../enums';
import { formatName, formatAppIdentifier } from '../../utils';
import { existsSync } from 'fs';

export async function runAuthGenerator(
  tree: Tree,
  options: { name: string; directory: string; preset: LibraryPresetType }
) {
  const appRoot = `apps/${options.directory}`;
  const libRoot = `libs/${options.directory}`;
  const libPath = `@${options.name}/${options.directory}`;

  // Generate shared libs
  execSync(`npx nx g react-lib ${options.directory}/shared/data-access/api --preset=${options.preset}`, { stdio: 'inherit' });
  execSync(`npx nx g react-lib ${options.directory}/shared/data-access/auth --preset=${options.preset}`, { stdio: 'inherit' });

  const appPackagePath = `${appRoot}/package.json`;

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${libRoot}/shared/data-access/api/src/index.ts`);
  tree.delete(`${libRoot}/shared/data-access/auth/src/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, '/lib-files'), libRoot, {
    ...options,
    formatName,
    formatAppIdentifier,
    formatDirectory: () => libPath
  });

    // Add dependencies
    addDependenciesToPackageJson(tree, dependencies['auth'], devDependencies['auth']);

    if (existsSync(appPackagePath)) {
      addDependenciesToPackageJson(tree, dependencies['auth'], devDependencies['auth'], appPackagePath);
    }

  await formatFiles(tree);
}

export default runAuthGenerator;
