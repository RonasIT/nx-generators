import * as path from 'path';
import { addDependenciesToPackageJson, formatFiles, generateFiles, installPackagesTask, Tree } from '@nx/devkit';
import { dependencies } from '../../shared/dependencies';
import { dynamicImport, formatName, getNxLibsPaths, LibraryType, searchNxLibsPaths } from '../../shared/utils';
import { FormGeneratorSchema } from './schema';
import { addFormUsage, getAppName, getFormUtilsDirectory, updateIndex } from './utils';

export async function formGenerator(tree: Tree, options: FormGeneratorSchema) {
  // Get input data
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>(
    'inquirer-autocomplete-standalone',
  );
  const availableLibsPaths = getNxLibsPaths([LibraryType.FEATURES, LibraryType.UI]);
  const libPath = await autocomplete({
    message: 'Enter the library path: ',
    source: async (input) => {
      const filteredNxLibsPaths = searchNxLibsPaths(availableLibsPaths, input as string);

      return filteredNxLibsPaths.map((path) => ({ value: path }));
    },
  });
  const fileName = options.name;
  const placeOfUse = options.placeOfUse;

  if (!fileName) {
    throw new Error('Form name is required');
  }

  // Generate form class
  const formsPath = `${libPath}/lib/forms`;
  const formFilePath = `${formsPath}/${fileName}.ts`;

  if (tree.exists(formFilePath)) {
    throw new Error('The form already exists');
  }

  const formUtilsDirectory = await getFormUtilsDirectory(tree, getAppName(libPath));
  const formClassName = `${formatName(fileName, true)}FormSchema`;
  generateFiles(tree, path.join(__dirname, `files`), formsPath, {
    className: formClassName,
    fileName,
    formUtilsDirectory,
  });
  updateIndex(formsPath, fileName, tree);

  // Add form usage
  if (placeOfUse) {
    await addFormUsage(libPath, placeOfUse, formClassName);
  }

  await formatFiles(tree);

  // Install dependencies
  addDependenciesToPackageJson(tree, dependencies.form, {});

  return (): void => {
    installPackagesTask(tree);
  };
}

export default formGenerator;
