import { execSync } from 'child_process';
import * as path from 'path';
import { formatFiles, generateFiles, Tree } from '@nx/devkit';

export async function runFormUtilsGenerator(
  tree: Tree,
  options: { directory: string }
) {
  const libRoot = `libs/${options.directory}`;

  // Generate shared libs
  execSync(`npx nx g react-lib --app=${options.directory} --scope=shared --type=utils --name=form`, { stdio: 'inherit' });

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${libRoot}/shared/utils/form/src/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, '/lib-files'), libRoot, {});

  await formatFiles(tree);
}

export default runFormUtilsGenerator;
