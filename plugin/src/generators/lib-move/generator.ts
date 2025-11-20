import { execSync } from 'child_process';
import { Tree } from '@nx/devkit';
import {
  LibraryType,
  constants,
  getLibraryDetailsByName,
  selectProject,
  validateLibraryType,
  getLibDirectoryName,
  getImportPathPrefix,
  askQuestion,
  normalizeLibPath,
} from '../../shared/utils';
import { LibMoveGeneratorSchema } from './schema';

export async function libMoveGenerator(tree: Tree, options: LibMoveGeneratorSchema): Promise<() => void> {
  const { AutoComplete } = require('enquirer');

  const { name: srcLibraryName, path: srcLibraryPath } = await getLibraryDetailsByName(tree, options.srcLibName);

  const libPathSegments = srcLibraryPath.split('/');
  const defaultLibraryName = libPathSegments.pop();

  options.app = options.app || (await selectProject(tree, 'application', 'Select the application: ')).name;

  const isSharedLib = options.app === constants.sharedValue;

  options.scope =
    options.scope ||
    (isSharedLib ? '' : await askQuestion(`Enter the scope (e.g: profile) or '${constants.sharedValue}': `));
  options.type = options.type
    ? validateLibraryType(options.type)
    : await new AutoComplete({
        name: 'library type',
        message: 'Select the library type:',
        limit: Object.values(LibraryType).length,
        choices: Object.values(LibraryType),
      }).run();

  const libraryName =
    options.name ||
    (await askQuestion(
      'If you want to rename the library, enter its new name. Otherwise just press Enter: ',
      defaultLibraryName,
    ));
  const libDirectoryName = getLibDirectoryName(libraryName, options.scope);
  const newLibImportPath = normalizeLibPath(`${options.app}/${options.scope}/${options.type}/${libDirectoryName}`);
  const newLibPath = `libs/${newLibImportPath}`;
  const fullLibraryPath = `${getImportPathPrefix(tree)}/${newLibImportPath}`;
  const fullLibraryName = newLibImportPath.split('/').join('-');

  execSync(
    `npx nx g mv --projectName=${srcLibraryName} --newProjectName=${fullLibraryName} --destination=${newLibPath} --importPath=${fullLibraryPath}`,
    { stdio: 'inherit' },
  );

  return (): void => {
    execSync('npx nx g lib-tags --skipRepoCheck', { stdio: 'inherit' });
  };
}

export default libMoveGenerator;
