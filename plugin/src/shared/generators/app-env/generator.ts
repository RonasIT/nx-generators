import { execSync } from 'child_process';
import * as path from 'path';
import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import { BaseGeneratorType } from '../../enums';
import { formatName, formatAppIdentifier, getImportPathPrefix } from '../../utils';

export async function runAppEnvGenerator(
  tree: Tree,
  options: { name: string; directory: string; baseGeneratorType: BaseGeneratorType },
): Promise<void> {
  const libRoot = `libs/${options.directory}`;
  const appType = options.baseGeneratorType.split('-')[0].toUpperCase();
  const libPath = `${getImportPathPrefix(tree)}/${options.directory}`;

  // Generate shared libs
  execSync(`npx nx g react-lib --app=${options.directory} --scope=shared --type=utils --name=app-env`, {
    stdio: 'inherit'
  });

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${libRoot}/shared/utils/app-env/src/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, 'lib-files'), libRoot, {
    ...options,
    formatName,
    formatAppIdentifier,
    formatDirectory: () => libPath,
    appType
  });

  await formatFiles(tree);
}

export default runAppEnvGenerator;
