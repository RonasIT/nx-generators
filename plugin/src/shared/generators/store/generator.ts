import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  Tree
} from '@nx/devkit';
import { dependencies } from '../../dependencies';
import { BaseGeneratorType, LibraryPresetType } from '../../enums';
import { formatName, formatAppIdentifier } from '../../utils';

const presets = {
  [BaseGeneratorType.EXPO_APP]: LibraryPresetType.EXPO,
  [BaseGeneratorType.NEXT_APP]: LibraryPresetType.NEXT
};

export async function runStoreGenerator(
  tree: Tree,
  options: { name: string; directory: string, baseGeneratorType: BaseGeneratorType }
) {
  const appRoot = `apps/${options.directory}`;
  const libRoot = `libs/${options.directory}`;
  const libPath = `@${options.name}/${options.directory}`;

  // Generate shared libs
  execSync(`npx nx g react-lib ${options.directory}/shared/data-access/store --preset=${presets[options.baseGeneratorType]}`, { stdio: 'inherit' });

  const appPackagePath = `${appRoot}/package.json`;

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${libRoot}/shared/data-access/store/src/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, `${options.baseGeneratorType}/lib-files`), libRoot, {
    ...options,
    formatName,
    formatAppIdentifier,
    formatDirectory: () => libPath
  });

  // Add dependencies
  addDependenciesToPackageJson(tree, dependencies['store'], {});

  if (existsSync(appPackagePath)) {
    addDependenciesToPackageJson(tree, dependencies['store'], {}, appPackagePath);
  }

  await formatFiles(tree);
}

export default runStoreGenerator;
