import { execSync } from 'child_process';
import * as path from 'path';
import { generateFiles, Tree } from '@nx/devkit';
import { BaseGeneratorType } from '../../enums';
import { appendFileContent } from '../../utils';
import { NavigationUtilsGeneratorSchema } from './schema';

export async function runNavigationUtilsGenerator(tree: Tree, options: NavigationUtilsGeneratorSchema): Promise<void> {
  const libRoot = `libs/${options.appDirectory}`;

  // Generate shared libs
  execSync(`npx nx g react-lib --app=${options.appDirectory} --scope=shared --type=utils --name=navigation`, {
    stdio: 'inherit',
  });

  // Remove unnecessary files and files that will be replaced
  const libPath = `${libRoot}/shared/utils/navigation/src`;
  tree.delete(`${libPath}/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, '/common-lib-files'), libRoot, {});

  if (options.baseGeneratorType === BaseGeneratorType.NEXT_APP) {
    generateFiles(tree, path.join(__dirname, '/next-app-lib-files'), libRoot, {});

    const newIndexContent = `export * from './utils';\nexport * from './types';`;
    appendFileContent(`${libPath}/lib/index.ts`, newIndexContent, tree);
  }
}

export default runNavigationUtilsGenerator;
