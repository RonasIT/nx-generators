import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { FormGeneratorSchema } from './schema';
import {
  appendFileContent,
  askQuestion,
  dynamicImport, filterSource,
  formatName,
  getNxLibsPaths,
  LibraryType, searchAliasPath,
  searchNxLibsPaths
} from '../../shared/utils';
import { existsSync } from 'fs';
import { kebabCase } from 'lodash';

async function getFormUtilsDirectory(): Promise<string> {
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');

  const utilsLibsPaths = getNxLibsPaths([LibraryType.UTILS]);
  const formUtilsLibsPaths = searchNxLibsPaths(utilsLibsPaths, 'utils/form/src', 'endsWith');

  if (!formUtilsLibsPaths.length) {
    throw new Error('Could not find a library with the form utilities.');
  }

  if (formUtilsLibsPaths.length > 1) {
    formUtilsLibsPaths[0] = await autocomplete({
      message: 'Select the path of the library with the form utilities:',
      source: (input) => filterSource(input, formUtilsLibsPaths)
    });
  }

  return searchAliasPath(formUtilsLibsPaths[0]);
}

function updateIndex(formsPath: string, fileName: string, tree: Tree): void {
  const formsIndexFilePath = `${formsPath}/index.ts`;
  const newIndexContent = `export * from './${kebabCase(fileName)}';\n`;
  if (!existsSync(formsIndexFilePath)) {
    tree.write(formsIndexFilePath, newIndexContent);
  } else {
    appendFileContent(formsIndexFilePath, newIndexContent, tree);
  }
}

export async function formGenerator(tree: Tree, options: FormGeneratorSchema) {
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');
  const availableLibsPaths = getNxLibsPaths([LibraryType.FEATURES, LibraryType.UI]);

  const libPath = await autocomplete({
    message: 'Enter the library path:',
    source: async (input) => {
      const filteredNxLibsPaths = searchNxLibsPaths(availableLibsPaths, input)

      return filteredNxLibsPaths.map((path) => ({ value: path }))
    }
  });
  const fileName = options.name || await askQuestion('Enter the name of the form (e.g: profile-settings):');

  const formsPath = `${libPath}/lib/forms`;
  const formUtilsDirectory = await getFormUtilsDirectory();
  generateFiles(tree, path.join(__dirname, `files`), formsPath, { className: `${formatName(fileName, true)}FormSchema`, formUtilsDirectory });
  tree.rename(`${formsPath}/form.ts`, `${formsPath}/${fileName}.ts`);

  updateIndex(formsPath, fileName, tree);

  await formatFiles(tree);
}

export default formGenerator;
