import { Tree } from '@nx/devkit';
import { LibMoveGeneratorSchema } from './schema';
import {
  LibraryType,
  askQuestion,
  constants,
  dynamicImport,
  filterSource,
  getLibraryDetailsByName,
  selectProject,
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

  const { name: srcLibraryName, path: srcLibraryPath } = await getLibraryDetailsByName(tree, options.srcLibName);
  
  const libPathSegments = srcLibraryPath.split('/');
  const defaultLibraryName = libPathSegments.pop();

  options.app = options.app || (await selectProject(tree, 'application', 'Select the application: ')).name;

  const isSharedLib = options.app === constants.sharedValue;

  options.scope = options.scope || (isSharedLib ? '' : await askQuestion(`Enter the scope (e.g: profile) or '${constants.sharedValue}': `));
  options.type = options.type ? validateLibraryType(options.type) : await autocomplete({
    message: 'Select the library type: ',
    source: (input) => filterSource(input as string, Object.values(LibraryType))
  });

  const libraryName = options.name || await askQuestion('If you want to rename the library, enter its new name. Otherwise just press Enter: ', defaultLibraryName);
  const libDirectoryName = getLibDirectoryName(libraryName, options.scope);
  const libPath = path.normalize(`${options.app}/${options.scope}/${options.type}/${libDirectoryName}`);

  // NOTE: Disable selection for library name (as provided / as derived) by excluding stdio from options
  const log = execSync(`npx nx g mv --project=${srcLibraryName} --destination=${libPath}`);
  
  console.log(log.toString('utf8'));

  return () => {
    execSync('npx nx g lib-tags --skipRepoCheck', { stdio: 'inherit' });
  };
}

export default libMoveGenerator;
