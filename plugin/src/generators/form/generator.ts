import * as path from 'path';
import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import { kebabCase } from 'lodash';
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
  const formName = options.name;
  const placeOfUse = options.placeOfUse;

  if (!formName) {
    throw new Error('Form name is required');
  }

  // Generate form class
  const fileName = kebabCase(formName);
  const formsPath = `${libPath}/lib/forms`;
  const formFilePath = `${formsPath}/${fileName}.ts`;

  if (tree.exists(formFilePath)) {
    throw new Error('The form already exists');
  }

  const formUtilsDirectory = await getFormUtilsDirectory(tree, getAppName(libPath));
  const formClassName = `${formatName(formName, true)}FormSchema`;
  generateFiles(tree, path.join(__dirname, `files`), formsPath, {
    className: formClassName,
    fileName,
    formUtilsDirectory,
  });
  updateIndex(formsPath, fileName, tree);

  // Add form usage
  if (placeOfUse) {
    await addFormUsage(libPath, formsPath, placeOfUse, formClassName);
  }

  await formatFiles(tree);
}

export default formGenerator;
