import { existsSync } from 'fs';
import { Tree } from '@nx/devkit';
// import { kebabCase } from 'lodash-es';
import { appendFileContent, dynamicImport } from '../../../shared/utils';

export async function updateIndex(formsPath: string, fileName: string, tree: Tree): Promise<void> {
  const { kebabCase } = await dynamicImport<typeof import('lodash-es')>(
    'lodash-es',
  );
  const formsIndexFilePath = `${formsPath}/index.ts`;
  const newIndexContent = `export * from './${kebabCase(fileName)}';\n`;

  if (!existsSync(formsIndexFilePath)) {
    tree.write(formsIndexFilePath, newIndexContent);
  } else {
    appendFileContent(formsIndexFilePath, newIndexContent, tree);
  }
}
