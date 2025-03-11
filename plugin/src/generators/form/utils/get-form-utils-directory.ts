import { Tree } from '@nx/devkit';
import { runFormUtilsGenerator } from '../../../shared/generators';
import {
  constants,
  getNxLibsPaths,
  LibraryType,
  searchAliasPath,
  searchNxLibsPaths,
  selectProject,
} from '../../../shared/utils';
import { getAppName } from './get-app-name';

function getFormUtilsPaths(): Array<string> {
  const utilsLibsPaths = getNxLibsPaths([LibraryType.UTILS]);

  return searchNxLibsPaths(utilsLibsPaths, 'utils/form/src', 'endsWith');
}

export async function getFormUtilsDirectory(tree: Tree, appName: string): Promise<string> {
  const { AutoComplete } = require('enquirer');
  const formUtilsLibsPaths = getFormUtilsPaths();

  if (!formUtilsLibsPaths.length) {
    const formUtilsAppDirectory = (
      await selectProject(
        tree,
        'application',
        'It\'s necessary to generate form utilities. What application should they be in?',
      )
    ).name;
    await runFormUtilsGenerator(tree, { directory: formUtilsAppDirectory });

    return searchAliasPath(getFormUtilsPaths()[0]) as string;
  }

  if (formUtilsLibsPaths.length > 1) {
    if (appName === constants.sharedValue) {
      const path = formUtilsLibsPaths.find((path) => getAppName(path) === constants.sharedValue) as string;

      return searchAliasPath(path) as string;
    }

    const availableLibsPaths = formUtilsLibsPaths.filter((path) => [appName, constants.sharedValue].includes(getAppName(path)));

    formUtilsLibsPaths[0] = await new AutoComplete({
      name: 'library path',
      message: 'Select the path of the library with the form utilities:',
      limit: 10,
      choices: availableLibsPaths,
    })
  }

  return searchAliasPath(formUtilsLibsPaths[0]) as string;
}
