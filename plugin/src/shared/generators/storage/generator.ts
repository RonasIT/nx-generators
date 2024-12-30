import { execSync } from 'child_process';
import * as path from 'path';
import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import { formatName, formatAppIdentifier, getImportPathPrefix } from '../../utils';

export async function runStorageGenerator(tree: Tree, options: { name: string; directory: string }): Promise<void> {
  const libRoot = `libs/${options.directory}`;
  const libPath = `${getImportPathPrefix(tree)}/${options.directory}`;

  // Generate shared libs
  execSync(`npx nx g react-lib --app=${options.directory} --scope=shared --type=data-access --name=storage`, {
    stdio: 'inherit'
  });

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${libRoot}/shared/data-access/storage/src/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, '/lib-files'), libRoot, {
    ...options,
    formatName,
    formatAppIdentifier,
    formatDirectory: () => libPath
  });

  await formatFiles(tree);
}

export default runStorageGenerator;
