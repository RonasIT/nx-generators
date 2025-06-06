import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import { generateFiles, Tree } from '@nx/devkit';
import { kebabCase } from 'lodash';
import { BaseGeneratorType } from '../../enums';
import { appendFileContent } from '../../utils';
import { NavigationUtilsGeneratorSchema } from './schema';

export function updateIndex(formsPath: string, fileName: string, tree: Tree): void {
  const formsIndexFilePath = `${formsPath}/index.ts`;
  const newIndexContent = `export * from './${kebabCase(fileName)}';\n`;

  if (!existsSync(formsIndexFilePath)) {
    tree.write(formsIndexFilePath, newIndexContent);
  } else {
    appendFileContent(formsIndexFilePath, newIndexContent, tree);
  }
}

export async function runNavigationUtilsGenerator(tree: Tree, options: NavigationUtilsGeneratorSchema): Promise<void> {
  const libRoot = `libs/${options.appDirectory}`;

  // Generate shared libs
  execSync(`npx nx g react-lib --app=${options.appDirectory} --scope=shared --type=utils --name=navigation`, {
    stdio: 'inherit',
  });

  // Remove unnecessary files and files that will be replaced
  const indexPath = `${libRoot}/shared/utils/navigation/src/index.ts`;
  tree.delete(indexPath);

  // Add lib files
  generateFiles(tree, path.join(__dirname, '/common-lib-files'), libRoot, {});

  if (options.baseGeneratorType === BaseGeneratorType.NEXT_APP) {
    generateFiles(tree, path.join(__dirname, '/next-app-lib-files'), libRoot, {});

    const newIndexContent = `export * from './utils';\nexport * from './types';`;
    appendFileContent(indexPath, newIndexContent, tree);
  }
}

export default runNavigationUtilsGenerator;
