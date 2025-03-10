import { existsSync } from 'fs';
import * as path from 'path';
import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import {
  appendFileContent,
  dynamicImport,
  formatName,
  getNxLibsPaths,
  LibraryType,
} from '../../shared/utils';
import { ReactComponentGeneratorSchema } from './schema';

export async function reactComponentGenerator(tree: Tree, options: ReactComponentGeneratorSchema): Promise<void> {
  const { AutoComplete } = require('enquirer');
  const { kebabCase } = await dynamicImport<typeof import('lodash-es')>(
    'lodash-es',
  );

  const nxLibsPaths = getNxLibsPaths([LibraryType.FEATURES, LibraryType.UI]);

  const libPath = await new AutoComplete({
    name: 'library path',
    message: 'Enter the library path:',
    limit: 10,
    choices: nxLibsPaths,
  }).run();

  const libRootPath = `${libPath}/lib`;
  const componentsPath = `${libRootPath}/components`;
  const componentPath = options.subcomponent ? `${libRootPath}/components/${kebabCase(options.name)}` : libRootPath;
  const shouldUpdateSrcIndex = !existsSync(libRootPath);
  const shouldUpdateLibIndex = !existsSync(componentsPath) && options.subcomponent;

  generateFiles(tree, path.join(__dirname, `files`), componentPath, {
    ...options,
    name: formatName(options.name, true),
  });

  const updateIndexes = (): void => {
    const componentsIndexFilePath = `${libRootPath}/components/index.ts`;

    if (shouldUpdateSrcIndex) {
      appendFileContent(`${libPath}/index.ts`, `export * from './lib';\n`, tree);
    }

    if (shouldUpdateLibIndex) {
      appendFileContent(`${libRootPath}/index.ts`, `export * from './components';\n`, tree);
    }

    if (!existsSync(componentsIndexFilePath)) {
      tree.write(componentsIndexFilePath, `export * from './${kebabCase(options.name)}';\n`);
    } else {
      appendFileContent(componentsIndexFilePath, `export * from './${kebabCase(options.name)}';\n`, tree);
    }
  };

  if (options.subcomponent) {
    updateIndexes();
  }

  await formatFiles(tree);
}

export default reactComponentGenerator;
