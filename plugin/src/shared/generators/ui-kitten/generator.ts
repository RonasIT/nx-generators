import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  installPackagesTask,
  Tree,
} from '@nx/devkit';
import { dependencies } from '../../../dependencies';
import { formatName, formatAppIdentifier } from '../../utils';

export async function runUIKittenGenerator(
  tree: Tree,
  options: { name: string; directory: string, confirmation: string }
) {
  const appRoot = `apps/${options.directory}`;
  const libRoot = `libs/${options.directory}`;
  const libPath = `@${options.name}/${options.directory}`;

  if (!options.confirmation) {
    return;
  }

  // Generate shared libs
  execSync(`npx nx g react-lib ${options.directory}/shared/features/user-theme-provider`, {
    stdio: 'inherit',
  });

  const appPackagePath = `${appRoot}/package.json`;

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${libRoot}/shared/features/user-theme-provider/src/index.ts`);

  generateFiles(tree, path.join(__dirname, '../../../generators/expo-app/app-files/app'), `${appRoot}/app`, {
    ...options,
    formatName,
    formatAppIdentifier,
    formatDirectory: () => libPath,
    isUIKittenEnabled: true
  });

  // Add lib files
  generateFiles(tree, path.join(__dirname, 'lib-files'), libRoot, {
    ...options,
    formatName,
    formatAppIdentifier,
    formatDirectory: () => libPath,
  });

  // Update styles lib exports
  const stylesLibIndexData = tree.read(`${libRoot}/shared/ui/styles/src/lib/index.ts`);
  const newStylesLibIndexData = stylesLibIndexData + `export * from './create-adaptive-styles';\nexport * from './eva-theme';\n`;

  tree.write(`${libRoot}/shared/ui/styles/src/lib/index.ts`, newStylesLibIndexData);

  // Add dependencies
  addDependenciesToPackageJson(tree, dependencies['ui-kitten'], {});

  if (existsSync(appPackagePath)) {
    addDependenciesToPackageJson(tree, dependencies['ui-kitten'], {}, appPackagePath);
  }

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
  };
}

export default runUIKittenGenerator;
