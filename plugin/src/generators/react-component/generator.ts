import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { kebabCase } from 'lodash';
import { ReactComponentGeneratorSchema } from './schema';
import { askQuestion, formatName, getNxLibsPaths, LibraryType, searchNxLibsPaths } from '../../shared/utils';
import { existsSync } from 'fs';

const dynamicImport = new Function(
  'specifier',
  'return import(specifier)'
) as <T = never>(specifier: string) => Promise<T>;

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

  const libRootPath = `${libPath}/lib`;
  const componentsPath = `${libRootPath}/components`;
  const componentPath = options.subcomponent
    ? `${libRootPath}/components/${kebabCase(options.name)}`
    : libRootPath;
  const shouldUpdateSrcIndex = !existsSync(libRootPath);
  const shouldUpdateLibIndex = !existsSync(componentsPath) && options.subcomponent;

  generateFiles(tree, path.join(__dirname, `files`), componentPath, { ...options, formatName });

  const appendFileContent = (path: string, endContent: string): void => {
    const content = tree.read(path, 'utf-8');
    const contentUpdate = content + endContent;

    tree.write(path, contentUpdate);
  };

  const updateIndexes = (): void => {
    const componentsIndexFilePath = `${libRootPath}/components/index.ts`;

    if (shouldUpdateSrcIndex) {
      appendFileContent(`${libPath}/index.ts`, `export * from './lib';\n`);
    }

    if (shouldUpdateLibIndex) {
      appendFileContent(`${libRootPath}/index.ts`, `export * from './components';\n`);
    }

    if (!existsSync(componentsIndexFilePath)) {
      tree.write(componentsIndexFilePath, `export * from './${kebabCase(options.name)}';\n`);
    } else {
      appendFileContent(componentsIndexFilePath, `export * from './${kebabCase(options.name)}';\n`);
    }
  }

  if (options.subcomponent) {
    updateIndexes();
  }

  await formatFiles(tree);
}

export default reactComponentGenerator;
