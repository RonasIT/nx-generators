import { Tree } from '@nx/devkit';
import { LibMoveGeneratorSchema } from './schema';
import {
  LibraryType,
  askQuestion,
  constants,
  dynamicImport,
  filterSource,
  getLibrariesDetails,
  selectApplication,
  selectLibrary,
  validateLibraryType,
  getLibDirectoryName
} from '../../shared/utils';
import { execSync } from 'child_process';
import * as path from 'path';

export async function libMoveGenerator(
  tree: Tree,
  options: LibMoveGeneratorSchema
) {
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');

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
    const selectedLibrary = await selectLibrary(tree, 'Select the library to move: ');

    srcLibraryName = selectedLibrary.name;
    srcLibraryPath = selectedLibrary.path;
  }
  
  const libPathSegments = srcLibraryPath.split('/');
  const defaultDestLibraryName = libPathSegments.pop();

  options.app = options.app || await selectApplication(tree, 'Select the application: ');

  const isSharedLib = options.app === constants.sharedValue;

  options.scope = options.scope || (isSharedLib ? '' : await askQuestion(`Enter the scope (e.g: profile) or '${constants.sharedValue}': `));
  options.type = options.type ? validateLibraryType(options.type) : await autocomplete({
    message: 'Select the library type: ',
    source: (input) => filterSource(input, Object.values(LibraryType))
  });

  const destLibraryName = options.name || await askQuestion('Enter a new library name: ', defaultDestLibraryName);
  const libDirectoryName = getLibDirectoryName(destLibraryName, options.scope);
  const libPath = path.normalize(`${options.app}/${options.scope}/${options.type}/${libDirectoryName}`);

  // NOTE: Disable selection for library name (as provided / as derived) by excluding stdio from options
  const log = execSync(`npx nx g mv --project=${srcLibraryName} --destination=${libPath}`);
  
  console.log(log.toString('utf8'));

  return () => {
    execSync('npx nx g lib-tags', { stdio: 'inherit' });
  };
}

export default libMoveGenerator;
