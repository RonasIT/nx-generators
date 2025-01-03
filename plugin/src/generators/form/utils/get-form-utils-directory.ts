import { Tree } from '@nx/devkit';
import { runFormUtilsGenerator } from '../../../shared/generators';
import {
  constants,
  dynamicImport,
  filterSource,
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
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>(
    'inquirer-autocomplete-standalone',
  );

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

    formUtilsLibsPaths[0] = await autocomplete({
      message: 'Select the path of the library with the form utilities: ',
      source: (input) =>
        filterSource(
          input as string,
          formUtilsLibsPaths.filter((path) => [appName, constants.sharedValue].includes(getAppName(path))),
        ),
    });
  }

  return searchAliasPath(formUtilsLibsPaths[0]) as string;
}
