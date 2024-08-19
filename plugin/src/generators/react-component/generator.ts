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
  })

  options.name = options.name || await askQuestion('Enter the name of the component (e.g: AppButton): ');
  options.subcomponent = options.subcomponent || await askQuestion('Generate component inside components folder? (y/n): ') === 'y';

  const libRootPath = `${libPath}/lib`;
  const componentPath = options.subcomponent
    ? `${libRootPath}/components/${kebabCase(options.name)}`
    : libRootPath;
  const shouldUpdateLibIndexes = !existsSync(libRootPath);

  generateFiles(tree, path.join(__dirname, `files`), componentPath, { ...options, formatName });

  const updateIndexes = (): void => {
    const componentsIndexFilePath = `${libRootPath}/components/index.ts`;

    if (shouldUpdateLibIndexes) {
      const libIndexFilePath = `${libPath}/index.ts`;
      const libIndexFileContent = tree.read(libIndexFilePath, 'utf-8');
      const contentUpdate = libIndexFileContent + `export * from './lib';\n`;

      tree.write(libIndexFilePath, contentUpdate);
    }

    if (!existsSync(componentsIndexFilePath)) {
      tree.write(componentsIndexFilePath, `export * from './${kebabCase(options.name)}';\n`);
    } else {
      const componentsIndexFileContent = tree.read(componentsIndexFilePath, 'utf-8');
      const contentUpdate = componentsIndexFileContent + `export * from './${kebabCase(options.name)}';\n`;

      tree.write(componentsIndexFilePath, contentUpdate);
    }
  }

  if (options.subcomponent) {
    updateIndexes();
  }

  await formatFiles(tree);
}

export default reactComponentGenerator;
