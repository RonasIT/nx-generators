import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { kebabCase } from 'lodash';
import { ReactComponentGeneratorSchema } from './schema';
import {
  appendFileContent,
  askQuestion,
  dynamicImport,
  formatName,
  getNxLibsPaths,
  LibraryType,
  searchNxLibsPaths
} from '../../shared/utils';
import { existsSync } from 'fs';

export async function reactComponentGenerator(
  tree: Tree,
  options: ReactComponentGeneratorSchema
) {
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');

  const nxLibsPaths = getNxLibsPaths([LibraryType.FEATURES, LibraryType.UI]);

  const libPath = await autocomplete({
    message: 'Enter the library path:',
    source: async (input) => {
      const filteredNxLibsPaths = searchNxLibsPaths(nxLibsPaths, input)

      return filteredNxLibsPaths.map((path) => ({ value: path }))
    }
  });

  options.name = options.name || await askQuestion('Enter the name of the component (e.g: AppButton): ');
  options.subcomponent = options.subcomponent || await askQuestion('Generate component inside components folder? (y/n): ') === 'y';
  options.withForwardRef = options.withForwardRef || await askQuestion('Generate component with forwardRef? (y/n): ') === 'y';

  const libRootPath = `${libPath}/lib`;
  const componentsPath = `${libRootPath}/components`;
  const componentPath = options.subcomponent
    ? `${libRootPath}/components/${kebabCase(options.name)}`
    : libRootPath;
  const shouldUpdateSrcIndex = !existsSync(libRootPath);
  const shouldUpdateLibIndex = !existsSync(componentsPath) && options.subcomponent;

  generateFiles(tree, path.join(__dirname, `files`), componentPath, { ...options, name: formatName(options.name, true)  });

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
  }

  if (options.subcomponent) {
    updateIndexes();
  }

  await formatFiles(tree);
}

export default reactComponentGenerator;
