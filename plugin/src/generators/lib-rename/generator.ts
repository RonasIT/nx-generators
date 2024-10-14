import { Tree } from '@nx/devkit';
import { LibRenameGeneratorSchema } from './schema';
import { askQuestion, selectLibrary } from '../../shared/utils';
import { execSync } from 'child_process';

export async function libRenameGenerator(
  tree: Tree,
  options: LibRenameGeneratorSchema
) {
  const { name: srcLibraryName, path: srcLibraryPath } = await selectLibrary(tree, 'Select the source library: ');
  const libPathSegments = srcLibraryPath.split('/');
  const defaultDestLibraryName = libPathSegments.pop();
  const destLibraryName = options.destLibName || await askQuestion('Enter a new library name: ', defaultDestLibraryName);
  
  // Remove `libs` path fragment
  libPathSegments.shift();
  libPathSegments.push(destLibraryName);

  const destLibraryPath = libPathSegments.join('/');

  execSync(`npx nx g mv --project=${srcLibraryName} --destination=${destLibraryPath}`);
}

export default libRenameGenerator;