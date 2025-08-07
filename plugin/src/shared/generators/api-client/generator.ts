import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import { addDependenciesToPackageJson, formatFiles, generateFiles, Tree } from '@nx/devkit';
import { dependencies } from '../../dependencies';
import { BaseGeneratorType } from '../../enums';
import { formatName, formatAppIdentifier, getImportPathPrefix } from '../../utils';

export async function runApiClientGenerator(
  tree: Tree,
  options: { name: string; directory: string; type: BaseGeneratorType },
): Promise<void> {
  const appRoot = `apps/${options.directory}`;
  const libRoot = `libs/${options.directory}`;
  const libPath = `${getImportPathPrefix(tree)}/${options.directory}`;

  // Generate shared libs
  execSync(`npx nx g react-lib --app=${options.directory} --scope=shared --type=data-access --name=api-client`, {
    stdio: 'inherit',
  });

  const appPackagePath = `${appRoot}/package.json`;

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${libRoot}/shared/data-access/api-client/src/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, '/lib-files'), libRoot, {
    ...options,
    formatName,
    formatAppIdentifier,
    libPath,
  });

  // Add dependencies
  addDependenciesToPackageJson(tree, dependencies['api-client'], {});

  if (existsSync(appPackagePath)) {
    addDependenciesToPackageJson(tree, dependencies['api-client'], {}, appPackagePath);
  }

  await formatFiles(tree);

  console.warn(`\nPlease set api endpoint in ${libPath}/shared/data-access/api-client/src/configuration.ts`);
}

export default runApiClientGenerator;
