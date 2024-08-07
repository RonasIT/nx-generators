import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  Tree
} from '@nx/devkit';
import { BaseGeneratorType } from '../../enums';
import { formatName, formatAppIdentifier } from '../../utils';

const dependencies = {
  "@ronas-it/rtkq-entity-api": "^0.3.1",
  "react-redux": "^9.1.2"
};

const expoAppDependencies = {
  "@ronas-it/react-native-common-modules": "^0.1.1"
};

export async function runStoreGenerator(
  tree: Tree,
  options: { name: string; directory: string, baseGeneratorType: BaseGeneratorType }
) {
  const appRoot = `apps/${options.directory}`;
  const libRoot = `libs/${options.directory}`;
  const libPath = `@${options.name}/${options.directory}`;
  const isExpoApp = options.baseGeneratorType === BaseGeneratorType.EXPO_APP;
  const appDependencies = isExpoApp ? { ...expoAppDependencies, ...dependencies } : dependencies;

  // Generate shared libs
  execSync(`npx nx g react-lib ${options.directory}/shared/data-access/store`, { stdio: 'inherit' });

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
  addDependenciesToPackageJson(tree, { ...appDependencies }, {});

  if (existsSync(appPackagePath)) {
    addDependenciesToPackageJson(tree, appDependencies, {}, appPackagePath);
  }

  await formatFiles(tree);
}

export default runStoreGenerator;
