import {
  constants,
  dynamicImport,
  filterSource,
  getNxLibsPaths,
  LibraryType,
  searchAliasPath,
  searchNxLibsPaths, selectApplication
} from '../../../shared/utils';
import { runFormUtilsGenerator } from '../../../shared/generators';
import { Tree } from '@nx/devkit';
import { getAppName } from './get-app-name';

function getFormUtilsPaths(): Array<string> {
  const utilsLibsPaths = getNxLibsPaths([LibraryType.UTILS]);
  return searchNxLibsPaths(utilsLibsPaths, 'utils/form/src', 'endsWith');
}

export async function getFormUtilsDirectory(tree: Tree, formApp: string): Promise<string> {
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');

  const formUtilsLibsPaths = getFormUtilsPaths();

  if (!formUtilsLibsPaths.length) {
    const appDirectory = await selectApplication(tree, 'It\'s necessary to generate form utilities. What application should they be in?')
    await runFormUtilsGenerator(tree, { directory: appDirectory });

    return searchAliasPath(getFormUtilsPaths()[0]);
  }

  if (formUtilsLibsPaths.length > 1) {
    if (formApp === constants.sharedValue) {
      return searchAliasPath(formUtilsLibsPaths.find((path) => getAppName(path) === constants.sharedValue))
    }

    formUtilsLibsPaths[0] = await autocomplete({
      message: 'Select the path of the library with the form utilities: ',
      source: (input) => filterSource(input, formUtilsLibsPaths.filter((path) => [formApp, constants.sharedValue].includes(path.split('/')[1])))
    });
  }

  return searchAliasPath(formUtilsLibsPaths[0]);
}
