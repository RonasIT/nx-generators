import { addDependenciesToPackageJson, formatFiles, generateFiles, installPackagesTask, Tree } from '@nx/devkit';
import * as path from 'path';
import { FormGeneratorSchema } from './schema';
import {
  addNamedImport,
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

function getFormUsageCode(formClassName: string): string {
  return `const formSchema = new ${formClassName}();\n
    const form = useForm<${formClassName}>({\n
      defaultValues: formSchema.formValues,\n
      resolver: yupResolver<any>(${formClassName}.validationSchema)\n
  });\n\n`
}

function addFormUsage(libPath: string, componentName: string, formClassName: string): void {
  const project = new Project({
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      quoteKind: QuoteKind.Single
    }
  });
  const componentsFiles = project.getSourceFiles([`${libPath}/lib/component.tsx`, `${libPath}/lib/components/**/component.tsx`]);
  const componentFile = componentsFiles.find((file) => file.getFunction(componentName) || file.getVariableDeclaration(componentName));
  if (!componentFile) {
    throw new Error('Could not find the component where the form should be used.');
  }

  const pathToForm = componentFile.getFilePath().includes('components') ? '../../forms' : './forms';
  addNamedImport(formClassName, pathToForm, componentFile);
  addNamedImport('useForm', 'react-hook-form', componentFile);
  addNamedImport('yupResolver', '@hookform/resolvers/yup', componentFile);

  const component = componentFile.getFunction(componentName) || componentFile.getVariableDeclaration(componentName).getInitializerIfKindOrThrow(SyntaxKind.FunctionExpression);
  component.setBodyText(`${getFormUsageCode(formClassName)}${component.getBodyText()}`);

  project.saveSync();
}

export async function formGenerator(tree: Tree, options: FormGeneratorSchema) {
  // Get input data
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');
  const availableLibsPaths = getNxLibsPaths([LibraryType.FEATURES, LibraryType.UI]);
  const libPath = await autocomplete({
    message: 'Enter the library path:',
    source: async (input) => {
      const filteredNxLibsPaths = searchNxLibsPaths(availableLibsPaths, input)

      return filteredNxLibsPaths.map((path) => ({ value: path }))
    }
  });
  const fileName = options.formName || await askQuestion('Enter the name of the form (e.g: profile-settings):');
  const componentName = options.componentName || await askQuestion(
    'Enter the name of the component, where the form should be (e.g: ProfileSettings). If it\'s not necessary, just press Enter.'
  );

  // Generate form class
  const formsPath = `${libPath}/lib/forms`;
  const formUtilsDirectory = await getFormUtilsDirectory();
  const formClassName = `${formatName(fileName, true)}FormSchema`;
  generateFiles(tree, path.join(__dirname, `files`), formsPath, { className: formClassName, formUtilsDirectory });
  tree.rename(`${formsPath}/form.ts`, `${formsPath}/${fileName}.ts`);
  updateIndex(formsPath, fileName, tree);

  // Add form usage
  if (componentName) {
    addFormUsage(libPath, componentName, formClassName);
  }

  await formatFiles(tree);

  // Install dependencies
  addDependenciesToPackageJson(tree, dependencies.form, {});
  return () => {
    installPackagesTask(tree);
  };
}

export default formGenerator;
