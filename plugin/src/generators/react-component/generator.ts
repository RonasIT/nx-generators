import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import * as inquirer from 'inquirer';
import { kebabCase } from 'lodash';
import { ReactComponentGeneratorSchema } from './schema';
import { askQuestion, formatName, getNxLibsPaths } from '../../shared';

export async function reactComponentGenerator(
  tree: Tree,
  options: ReactComponentGeneratorSchema
) {
  const { libPath } = await inquirer.prompt([
    {
      type: 'list',
      name: 'libPath',
      message: 'Choose the lib path:',
      choices: getNxLibsPaths(),
    },
  ]);

  options.name = options.name || await askQuestion('Enter the name of the component (e.g: AppButton): ');

  const libRootPath = `${libPath}/lib`;
  const componentPath = options.subcomponent
    ? `${libRootPath}/components/${kebabCase(options.name)}`
    : libRootPath;

  generateFiles(tree, path.join(__dirname, `files`), componentPath, { ...options, formatName });

  await formatFiles(tree);
}

export default reactComponentGenerator;
