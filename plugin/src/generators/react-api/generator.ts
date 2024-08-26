import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { camelCase, kebabCase, startCase } from 'lodash';
import { ReactApiGeneratorSchema } from './schema';
import { askQuestion, dynamicImport, getNxLibsPaths, LibraryType, searchAliasPath, searchNxLibsPaths } from '../../shared/utils';

export async function reactComponentGenerator(
  tree: Tree,
  options: ReactApiGeneratorSchema
) {
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');
  const nxLibsPaths = getNxLibsPaths([LibraryType.DATA_ACCESS]);
  const apiLibsPaths = searchNxLibsPaths(nxLibsPaths, 'data-access/api/');
  const apiClientLibsPaths = searchNxLibsPaths(nxLibsPaths, 'data-access/api-client/');

  if (!apiClientLibsPaths.length) {
    throw new Error('Could not find API Client path.');
  }

  if (!apiLibsPaths.length) {
    throw new Error('Could not find API path.');
  }

  if (apiClientLibsPaths.length > 1) {
    apiClientLibsPaths[0] = await autocomplete({
      message: 'Select the api client library path:',
      suggestOnly: true,
      source: async () => apiClientLibsPaths.map((path) => ({ value: path }))
    });
  }

  if (apiLibsPaths.length > 1) {
    apiLibsPaths[0] = await autocomplete({
      message: 'Select the api library path:',
      suggestOnly: true,
      source: async () => apiLibsPaths.map((path) => ({ value: path }))
    });
  }

  const apiClientDirectory = searchAliasPath(apiClientLibsPaths[0]);

  const libPath = apiLibsPaths[0];
  const libRootPath = `${libPath}/lib`;

  options.name = options.name || await askQuestion('Enter the name of the API (e.g: Profile): ');
  options.baseEndpoint = options.baseEndpoint || await askQuestion('Enter the base endpoint (e.g: profile): ');

  const apiName = kebabCase(options.name);

  const apiPath = `${libRootPath}/${apiName}`;
  const entityName = startCase(camelCase(apiName)).replace(/\s+/g, '');

  generateFiles(tree, path.join(__dirname, `files`), apiPath, {
    ...options,
    apiName: camelCase(options.name),
    entityName,
    entityFileName: apiName,
    apiClientDirectory,
    baseEndpoint: options.baseEndpoint
  });

  tree.rename(`${apiPath}/models/entity.ts`, `${apiPath}/models/${apiName}.ts`);

  const appendFileContent = (path: string, endContent: string): void => {
    const content = tree.read(path, 'utf-8');
    const contentUpdate = content + endContent;

    tree.write(path, contentUpdate);
  };

  appendFileContent(`${libRootPath}/index.ts`, `export * from './${apiName}';\n`);

  console.log(`\nDon't forget to add the new API to the redux store.`);

  await formatFiles(tree);
}

export default reactComponentGenerator;
