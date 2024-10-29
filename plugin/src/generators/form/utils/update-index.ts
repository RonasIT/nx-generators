import { Tree } from '@nx/devkit';
import { kebabCase } from 'lodash';
import { existsSync } from 'fs';
import { appendFileContent } from '../../../shared/utils';

export function updateIndex(formsPath: string, fileName: string, tree: Tree): void {
  const formsIndexFilePath = `${formsPath}/index.ts`;
  const newIndexContent = `export * from './${kebabCase(fileName)}';\n`;
  if (!existsSync(formsIndexFilePath)) {
    tree.write(formsIndexFilePath, newIndexContent);
  } else {
    appendFileContent(formsIndexFilePath, newIndexContent, tree);
  }
}
