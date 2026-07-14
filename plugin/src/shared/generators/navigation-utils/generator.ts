import { execSync } from 'child_process';
import * as path from 'path';
import { generateFiles, Tree } from '@nx/devkit';
import { NavigationUtilsGeneratorSchema } from './schema';

export async function runNavigationUtilsGenerator(tree: Tree, options: NavigationUtilsGeneratorSchema): Promise<void> {
  const { appDirectory } = options;

  execSync(`npx nx g react-lib --app=${appDirectory} --scope=shared --type=utils --name=navigation`, {
    stdio: 'inherit',
  });

  const libRoot = `libs/${appDirectory}`;
  const libPath = `${libRoot}/shared/utils/navigation/src`;
  tree.delete(`${libPath}/index.ts`);

  generateFiles(tree, path.join(__dirname, 'navigation-lib-files'), libRoot, {});
}

export default runNavigationUtilsGenerator;
