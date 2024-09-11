import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { FormGeneratorSchema } from './schema';
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
import { kebabCase } from 'lodash';

export async function formGenerator(tree: Tree, options: FormGeneratorSchema) {
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');
  const nxLibsPaths = getNxLibsPaths([LibraryType.FEATURES, LibraryType.UI]);

  const libPath = await autocomplete({
    message: 'Enter the library path:',
    source: async (input) => {
      const filteredNxLibsPaths = searchNxLibsPaths(nxLibsPaths, input)

      return filteredNxLibsPaths.map((path) => ({ value: path }))
    }
  });

  const fileName = options.name || await askQuestion('Enter the name of the form (e.g: profile-settings):');
  const formsPath = `${libPath}/lib/forms`;
  generateFiles(tree, path.join(__dirname, `files`), formsPath, { className: `${formatName(fileName, true)}FormSchema` });
  tree.rename(`${formsPath}/form.ts`, `${formsPath}/${fileName}.ts`);

  const formsIndexFilePath = `${formsPath}/index.ts`;
  const newIndexContent = `export * from './${kebabCase(fileName)}';\n`;
  if (!existsSync(formsIndexFilePath)) {
    tree.write(formsIndexFilePath, newIndexContent);
  } else {
    appendFileContent(formsIndexFilePath, newIndexContent, tree);
  }

  await formatFiles(tree);
}

export default formGenerator;
