import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import { addDependenciesToPackageJson, formatFiles, generateFiles, Tree } from '@nx/devkit';
import { dependencies } from '../../dependencies';
import { formatName, formatAppIdentifier, getImportPathPrefix } from '../../utils';

export async function runRNStylesGenerator(tree: Tree, options: { name: string; directory: string }): Promise<void> {
  const appRoot = `apps/${options.directory}`;
  const libRoot = `libs/${options.directory}`;
  const libPath = `${getImportPathPrefix(tree)}/${options.directory}`;

  // Generate shared libs
  execSync(
    `npx nx g react-lib --app=${options.directory} --scope=shared --type=ui --name=styles --withComponent=false`,
    {
      stdio: 'inherit',
    },
  );

  const appPackagePath = `${appRoot}/package.json`;

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${libRoot}/shared/ui/styles/src/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, 'lib-files'), libRoot, {
    ...options,
    formatName,
    formatAppIdentifier,
    libPath,
  });

  // Add dependencies
  addDependenciesToPackageJson(tree, dependencies['rn-styles'], {});

  if (existsSync(appPackagePath)) {
    addDependenciesToPackageJson(tree, dependencies['rn-styles'], {}, appPackagePath);
  }

  await formatFiles(tree);
}

export default runRNStylesGenerator;
