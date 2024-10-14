import { Tree, output } from '@nx/devkit';
import { LibMoveGeneratorSchema } from './schema';
import { LibraryType, askQuestion, constants, dynamicImport, filterSource, getLibrariesDetails, selectApplication, selectLibrary, validateLibraryType } from '../../shared/utils';
import { execSync } from 'child_process';
import { getLibDirectoryName } from '../react-lib/utils';
import path = require('path');

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
    const selectedLibrary = await selectLibrary(tree, 'Select the source library: ');

    srcLibraryName = selectedLibrary.name;
    srcLibraryPath = selectedLibrary.path;
  }
  
  const libPathSegments = srcLibraryPath.split('/');
  const defaultDestLibraryName = libPathSegments.pop();
  const destLibraryName = options.name || await askQuestion('Enter a new library name: ', defaultDestLibraryName);

  options.app = options.app || await selectApplication(tree, 'Select the application: ');

  const isSharedLib = options.app === constants.sharedValue;

  options.scope = options.scope || (isSharedLib ? '' : await askQuestion(`Enter the scope (e.g: profile) or '${constants.sharedValue}': `));
  options.type = options.type ? validateLibraryType(options.type) : await autocomplete({
    message: 'Select the library type: ',
    source: (input) => filterSource(input, Object.values(LibraryType))
  });

  const scopeTag = options.scope || constants.sharedValue;
  const tags = [`app:${options.app}`, `scope:${scopeTag}`, `type:${options.type}`];

  const libDirectoryName = getLibDirectoryName(destLibraryName, options.scope);
  const libPath = path.normalize(`${options.app}/${options.scope}/${options.type}/${libDirectoryName}`);

  // NOTE: Disable selection for library name (as provided / as derived) by excluding stdio from options
  const log = execSync(`npx nx g mv --project=${srcLibraryName} --destination=${libPath}`);
  
  console.log(log.toString('utf8'));
  output.success({ title: `${libPath.replace('/', '-')}`});

  // TODO: add tags, run tags validation
  return () => {

  };
}

export default libMoveGenerator;
