import * as path from 'path';
import { addDependenciesToPackageJson, formatFiles, generateFiles, installPackagesTask, Tree } from '@nx/devkit';
import { dependencies } from '../../shared/dependencies';
import { formatName, getNxLibsPaths, LibraryType } from '../../shared/utils';
import { FormGeneratorSchema } from './schema';
import { addFormUsage, getAppName, getFormUtilsDirectory, updateIndex } from './utils';

export async function formGenerator(tree: Tree, options: FormGeneratorSchema) {
  // Get input data
  const { AutoComplete } = require('enquirer');
  const availableLibsPaths = getNxLibsPaths([LibraryType.FEATURES, LibraryType.UI]);
  const libPath = await new AutoComplete({
    name: 'library path',
    message: 'Enter the library path:',
    limit: 10,
    choices: availableLibsPaths,
  }).run();
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
  await updateIndex(formsPath, fileName, tree);

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
