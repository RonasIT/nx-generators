import { execSync } from 'child_process';
import * as path from 'path';
import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import { NavigationUtilsGeneratorSchema } from './schema';

export async function runNavigationUtilsGenerator(tree: Tree, options: NavigationUtilsGeneratorSchema): Promise<void> {
  const libRoot = `libs/${options.appDirectory}`;

  // Generate shared libs
  execSync(`npx nx g react-lib --app=${options.appDirectory} --scope=shared --type=utils --name=navigation`, {
    stdio: 'inherit',
  });

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${libRoot}/shared/utils/navigation/src/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, `/${options.baseGeneratorType}-lib-files`), libRoot, {});

  await formatFiles(tree);
}

export default runNavigationUtilsGenerator;
