import { execSync } from 'child_process';
import * as path from 'path';
import {
  formatFiles,
  generateFiles,
  Tree
} from '@nx/devkit';
import { LibraryPresetType } from '../../enums';
import { formatName, formatAppIdentifier } from '../../utils';

export async function runAppEnvGenerator(
  tree: Tree,
  options: { name: string; directory: string; preset: LibraryPresetType }
) {
  const libRoot = `libs/${options.directory}`;
  const libPath = `@${options.name}/${options.directory}`;

  // Generate shared libs
  execSync(`npx nx g react-lib ${options.directory}/shared/utils/app-env --preset=${options.preset}`, { stdio: 'inherit' });

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${libRoot}/shared/utils/app-env/src/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, 'lib-files'), libRoot, {
    ...options,
    formatName,
    formatAppIdentifier,
    formatDirectory: () => libPath
  });

  await formatFiles(tree);
}

export default runAppEnvGenerator;
