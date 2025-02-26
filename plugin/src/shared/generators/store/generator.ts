import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import { addDependenciesToPackageJson, formatFiles, generateFiles, Tree } from '@nx/devkit';
import { dependencies } from '../../dependencies';
import { formatName, formatAppIdentifier, getImportPathPrefix } from '../../utils';
import { StoreGeneratorSchema } from './schema';

export async function runStoreGenerator(tree: Tree, options: StoreGeneratorSchema): Promise<void> {
  const appRoot = `apps/${options.directory}`;
  const libRoot = `libs/${options.directory}`;
  const libPath = `${getImportPathPrefix(tree)}/${options.directory}`;

  // Generate shared libs
  execSync(`npx nx g react-lib --app=${options.directory} --scope=shared --type=data-access --name=store`, {
    stdio: 'inherit',
  });

  const appPackagePath = `${appRoot}/package.json`;

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${libRoot}/shared/data-access/store/src/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, `${options.baseGeneratorType}/lib-files`), libRoot, {
    ...options,
    formatName,
    formatAppIdentifier,
    libPath,
  });

  // Add dependencies
  addDependenciesToPackageJson(tree, dependencies['store'], {});

  if (existsSync(appPackagePath)) {
    addDependenciesToPackageJson(tree, dependencies['store'], {}, appPackagePath);
  }

  await formatFiles(tree);
}

export default runStoreGenerator;
