import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { kebabCase } from 'lodash';
import { ReactComponentGeneratorSchema } from './schema';
import { askQuestion, formatName, getNxLibsPaths, LibraryType, searchNxLibsPaths } from '../../shared/utils';

export async function reactComponentGenerator(
  tree: Tree,
  options: ReactComponentGeneratorSchema
) {

  // TODO: Resolve the problem with import
  const { default: autocomplete } = await import('inquirer-autocomplete-standalone');

  const nxLibsPaths = getNxLibsPaths([LibraryType.FEATURES, LibraryType.UI]);

  const libPath = await autocomplete({
    message: 'Enter the library path:',
    source: async (input) => {
      const filteredNxLibsPaths = searchNxLibsPaths(nxLibsPaths, input)

      return filteredNxLibsPaths.map((path) => ({ value: path }))
    }
  })

  options.name = options.name || await askQuestion('Enter the name of the component (e.g: AppButton): ');

  const libRootPath = `${libPath}/lib`;
  const componentPath = options.subcomponent
    ? `${libRootPath}/components/${kebabCase(options.name)}`
    : libRootPath;

  generateFiles(tree, path.join(__dirname, `files`), componentPath, { ...options, formatName });

  await formatFiles(tree);
}

export default reactComponentGenerator;
