import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { ReactComponentGeneratorSchema } from './schema';
import { askQuestion, convertToKebabCase, formatName } from '../../shared/utils';
import * as fs from 'fs';

export async function reactComponentGenerator(
  tree: Tree,
  options: ReactComponentGeneratorSchema
) {
  options.directory = options.directory || await askQuestion('Enter the directory of the library: ');
  const libPath = `libs/${options.directory}`

  if (!fs.existsSync(libPath)) {
    console.error(`Directory ${libPath} does not exist!`);
    process.exit(1);
  }

  options.name = options.name || await askQuestion('Enter the name of the component (e.g: AppButton): ');

  const libRootPath = `${libPath}/src/lib`;
  const componentPath = options.subcomponent
    ? libRootPath
    : `${libRootPath}/${convertToKebabCase(options.name)}`;

  generateFiles(
    tree,
    path.join(__dirname, `files/${options.subcomponent ? 'subcomponent' : 'component'}`),
    componentPath,
    { ...options, formatName }
  );

  await formatFiles(tree);
}

export default reactComponentGenerator;
