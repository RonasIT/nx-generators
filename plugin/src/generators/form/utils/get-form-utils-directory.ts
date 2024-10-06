import {
  dynamicImport,
  filterSource,
  getNxLibsPaths,
  LibraryType,
  searchAliasPath,
  searchNxLibsPaths
} from '../../../shared/utils';

export async function getFormUtilsDirectory(): Promise<string> {
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');

  const utilsLibsPaths = getNxLibsPaths([LibraryType.UTILS]);
  const formUtilsLibsPaths = searchNxLibsPaths(utilsLibsPaths, 'utils/form/src', 'endsWith');

  if (!formUtilsLibsPaths.length) {
    throw new Error('Could not find a library with the form utilities.');
  }

  if (formUtilsLibsPaths.length > 1) {
    formUtilsLibsPaths[0] = await autocomplete({
      message: 'Select the path of the library with the form utilities: ',
      source: (input) => filterSource(input, formUtilsLibsPaths)
    });
  }

  return searchAliasPath(formUtilsLibsPaths[0]);
}
