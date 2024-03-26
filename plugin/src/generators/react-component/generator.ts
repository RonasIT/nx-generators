import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { ReactComponentGeneratorSchema } from './schema';
import { askQuestion, convertToKebabCase, formatName } from '../../shared/utils';

export async function reactComponentGenerator(
  tree: Tree,
  options: ReactComponentGeneratorSchema
) {
  options.directory = options.directory || await askQuestion('Enter the directory of the library: ');
  options.name = options.name || await askQuestion('Enter the name of the component (e.g: AppButton): ');

  const libPath = `libs/${options.directory}/src/lib`;
  const componentPath = options.subcomponent ? libPath : `${libPath}/${convertToKebabCase(options.name)}`;

  generateFiles(
    tree,
    path.join(__dirname, `files/${options.subcomponent ? 'subcomponent' : 'component'}`),
    componentPath,
    { ...options, formatName }
  );

  await formatFiles(tree);
}

export default reactComponentGenerator;
