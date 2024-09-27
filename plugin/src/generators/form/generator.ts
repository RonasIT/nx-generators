import { addDependenciesToPackageJson, formatFiles, generateFiles, installPackagesTask, Tree } from '@nx/devkit';
import * as path from 'path';
import { FormGeneratorSchema } from './schema';
import {
  addNamedImport,
  appendFileContent,
  dynamicImport, filterSource,
  formatName,
  getNxLibsPaths,
  LibraryType, searchAliasPath,
  searchNxLibsPaths
} from '../../shared/utils';
import { existsSync } from 'fs';
import { kebabCase } from 'lodash';
import { dependencies } from '../../shared/dependencies';
import { IndentationText, Project, QuoteKind, SyntaxKind } from 'ts-morph';

async function getFormUtilsDirectory(): Promise<string> {
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');

  const utilsLibsPaths = getNxLibsPaths([LibraryType.UTILS]);
  const formUtilsLibsPaths = searchNxLibsPaths(utilsLibsPaths, 'utils/form/src', 'endsWith');

  if (!formUtilsLibsPaths.length) {
    throw new Error('Could not find a library with the form utilities.');
  }

  if (formUtilsLibsPaths.length > 1) {
    formUtilsLibsPaths[0] = await autocomplete({
      message: 'Select the path of the library with the form utilities: ',
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

function getFormUsageCode(formClassName: string): string {
  return `const formSchema = new ${formClassName}();
const form = useForm<${formClassName}>({
  defaultValues: formSchema.formValues,
  resolver: yupResolver<any>(${formClassName}.validationSchema)
});\n\n`
}

async function addFormUsage(libPath: string, placeOfUse: string, formClassName: string): Promise<void> {
  const project = new Project({
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      quoteKind: QuoteKind.Single
    }
  });
  const files = project.addSourceFilesAtPaths([`${libPath}/lib/**/*.tsx`, `${libPath}/lib/**/*.ts`]);
  const file = files.find((file) => file.getFunction(placeOfUse) || file.getVariableDeclaration(placeOfUse));
  if (!file) {
    throw new Error('Could not find the place where the form should be used.');
  }

  const pathToForm = file.getFilePath().includes('components')
    ? '../../forms'
    : file.getFilePath().includes('hooks')
      ? '../forms'
      : './forms';
  addNamedImport(formClassName, pathToForm, file);
  addNamedImport('useForm', 'react-hook-form', file);
  addNamedImport('yupResolver', '@hookform/resolvers/yup', file);

  const component = file.getFunction(placeOfUse) || file.getVariableDeclaration(placeOfUse).getInitializerIfKindOrThrow(SyntaxKind.FunctionExpression);
  component.setBodyText(`${getFormUsageCode(formClassName)}${component.getBodyText()}`);

  project.saveSync();
}

export async function formGenerator(tree: Tree, options: FormGeneratorSchema) {
  // Get input data
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');
  const availableLibsPaths = getNxLibsPaths([LibraryType.FEATURES, LibraryType.UI]);
  const libPath = await autocomplete({
    message: 'Enter the library path: ',
    source: async (input) => {
      const filteredNxLibsPaths = searchNxLibsPaths(availableLibsPaths, input)

      return filteredNxLibsPaths.map((path) => ({ value: path }))
    }
  });
  const fileName = options.name;
  const placeOfUse = options.placeOfUse;

  // Generate form class
  const formsPath = `${libPath}/lib/forms`;
  const formFilePath = `${formsPath}/${fileName}.ts`;
  if (tree.exists(formFilePath)) {
    throw new Error('The form already exists');
  }

  const formUtilsDirectory = await getFormUtilsDirectory();
  const formClassName = `${formatName(fileName, true)}FormSchema`;
  generateFiles(tree, path.join(__dirname, `files`), formsPath, { className: formClassName, formUtilsDirectory });
  tree.rename(`${formsPath}/form.ts`, formFilePath);
  updateIndex(formsPath, fileName, tree);

  // Add form usage
  if (placeOfUse) {
    await addFormUsage(libPath, placeOfUse, formClassName);
  }

  await formatFiles(tree);

  // Install dependencies
  addDependenciesToPackageJson(tree, dependencies.form, {});
  return () => {
    installPackagesTask(tree);
  };
}

export default formGenerator;
