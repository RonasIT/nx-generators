import { Tree } from '@nx/devkit';
import { LibRenameGeneratorSchema } from './schema';
import { askQuestion, getLibrariesDetails, selectLibrary } from '../../shared/utils';
import { execSync } from 'child_process';

export async function libRenameGenerator(
  tree: Tree,
  options: LibRenameGeneratorSchema
) {
  let srcLibraryName: string;
  let srcLibraryPath: string;

  if (options.srcLibName) {
    srcLibraryName = options.srcLibName;

    const library = getLibrariesDetails(tree).find((library) => library.name === srcLibraryName);

    if (!library) {
      throw new Error(`Library ${srcLibraryName} not found`);
    }

    srcLibraryPath = library.path;
  } else {
    const selectedLibrary = await selectLibrary(tree, 'Select the source library: ');

    srcLibraryName = selectedLibrary.name;
    srcLibraryPath = selectedLibrary.path;
  }
  
  const libPathSegments = srcLibraryPath.split('/');
  const defaultDestLibraryName = libPathSegments.pop();
  const destLibraryName = options.destLibName || await askQuestion('Enter a new library name: ', defaultDestLibraryName);
  
  // Remove `libs` path fragment
  libPathSegments.shift();
  libPathSegments.push(destLibraryName);

  const destLibraryPath = libPathSegments.join('/');
  // NOTE: Disable selection for library name (as provided / as derived) by excluding stdio from options
  const log = execSync(`npx nx g mv --project=${srcLibraryName} --destination=${destLibraryPath}`);
  
  console.log(log.toString('utf8'));
}

export default libRenameGenerator;
