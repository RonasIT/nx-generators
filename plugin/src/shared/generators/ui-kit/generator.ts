import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import { addDependenciesToPackageJson, formatFiles, generateFiles, Tree } from '@nx/devkit';
import { dependencies } from '../../dependencies';
import { getImportPathPrefix } from '../../utils';

export async function runUiKitGenerator(tree: Tree, options: { name: string; directory: string }): Promise<void> {
  const appRoot = `apps/${options.directory}`;
  const i18nRoot = `i18n/${options.directory}`;
  const libRoot = `libs/${options.directory}`;

  const libPath = `${getImportPathPrefix(tree)}/${options.directory}`;
  const appPackagePath = `${appRoot}/package.json`;
  const appLayoutPath = `${appRoot}/app`;
  const toastServicePath = `${libRoot}/shared/utils/toast-service/src`;

  // Generate ui-kit lib
  execSync(
    `npx nx g react-lib --app=${options.directory} --scope=shared --type=ui --name=ui-kit --withComponent=false`,
    {
      stdio: 'inherit',
    },
  );

  // Generate toast-service lib
  execSync(`npx nx g react-lib --app=${options.directory} --scope=shared --type=utils --name=toast-service`, {
    stdio: 'inherit',
  });

  // Remove unnecessary files
  tree.delete(`${libRoot}/shared/ui/ui-kit/src/index.ts`);
  tree.delete(`${appLayoutPath}/index.tsx`);
  tree.delete(`${i18nRoot}/shared/en.json`);
  tree.delete(`${toastServicePath}/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, 'lib-files'), libRoot, {
    ...options,
    libPath,
  });

  // Add app files
  generateFiles(tree, path.join(__dirname, 'app-files'), appRoot, {
    ...options,
    libPath,
  });

  // Add layout files
  generateFiles(tree, path.join(__dirname, 'layout-files'), appLayoutPath, {
    ...options,
    libPath,
  });

  // Add i18n files
  generateFiles(tree, path.join(__dirname, 'i18n'), i18nRoot, {});

  // Add toast-service files
  generateFiles(tree, path.join(__dirname, 'toast-service-files'), toastServicePath, {});

  // Add dependencies
  addDependenciesToPackageJson(tree, dependencies['ui-kit'], {});

  if (existsSync(appPackagePath)) {
    addDependenciesToPackageJson(tree, dependencies['ui-kit'], {}, appPackagePath);
  }

  await formatFiles(tree);
}

export default runUiKitGenerator;
