import * as path from 'path';
import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import { camelCase, kebabCase, startCase } from 'lodash';
import { IndentationText, Project, QuoteKind, StructureKind, SyntaxKind } from 'ts-morph';
import {
  addNamedImport,
  appendFileContent,
  getNxLibsPaths,
  LibraryType,
  searchAliasPath,
  searchNxLibsPaths,
} from '../../shared/utils';
import { EntityApiGeneratorSchema } from './schema';

export async function entityApiGenerator(tree: Tree, options: EntityApiGeneratorSchema): Promise<void> {
  const { AutoComplete } = require('enquirer');

  const nxLibsPaths = getNxLibsPaths([LibraryType.DATA_ACCESS]);
  const apiLibsPaths = searchNxLibsPaths(nxLibsPaths, 'data-access/api/src', 'endsWith');
  const apiClientLibsPaths = searchNxLibsPaths(nxLibsPaths, 'data-access/api-client/src', 'endsWith');

  if (!apiClientLibsPaths.length) {
    throw new Error('Could not find API Client path.');
  }

  if (!apiLibsPaths.length) {
    throw new Error('Could not find API path.');
  }

  if (apiClientLibsPaths.length > 1) {
    apiClientLibsPaths[0] = await new AutoComplete({
      name: 'library path',
      message: 'Select the api client library path:',
      limit: 10,
      choices: apiClientLibsPaths,
    }).run();
  }

  if (apiLibsPaths.length > 1) {
    apiLibsPaths[0] = await new AutoComplete({
      name: 'api library path',
      message: 'Select the api library path:',
      limit: 10,
      choices: apiLibsPaths,
    }).run();
  }

  const apiDirectory = searchAliasPath(apiLibsPaths[0]) as string;
  const apiClientDirectory = searchAliasPath(apiClientLibsPaths[0]);

  const libPath = apiLibsPaths[0];
  const libRootPath = `${libPath}/lib`;

  const apiName = kebabCase(options.name);
  const apiPath = `${libRootPath}/${apiName}`;
  const entityName = startCase(camelCase(apiName)).replace(/\s+/g, '');

  generateFiles(tree, path.join(__dirname, `files`), apiPath, {
    ...options,
    apiName: camelCase(options.name),
    entityName,
    entityFileName: apiName,
    apiClientDirectory,
    baseEndpoint: options.baseEndpoint.startsWith('/') ? options.baseEndpoint : `/${options.baseEndpoint}`,
  });

  tree.rename(`${apiPath}/models/entity.ts`, `${apiPath}/models/${apiName}.ts`);

  appendFileContent(`${libRootPath}/index.ts`, `export * from './${apiName}';\n`, tree);

  const storeLibsPaths = searchNxLibsPaths(nxLibsPaths, 'data-access/store/src', 'endsWith');

  if (!storeLibsPaths.length) {
    await formatFiles(tree);

    throw new Error('Could not find redux store path.');
  }

  if (storeLibsPaths.length > 1) {
    storeLibsPaths[0] = await new AutoComplete({
      name: 'store library path',
      message: 'Select the store library path:',
      limit: 10,
      choices: storeLibsPaths,
    }).run();
  }

  // Update redux store
  const apiNameDeclaration = camelCase(options.name + 'Api');
  const project = new Project({
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      quoteKind: QuoteKind.Single,
    },
  });
  const store = project.addSourceFileAtPath(`${storeLibsPaths[0]}/store.ts`);

  addNamedImport(apiNameDeclaration, apiDirectory, store);

  const rootReducer = store.getVariableDeclarationOrThrow('rootReducer');

  rootReducer.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression).addProperty({
    name: `[${apiNameDeclaration}.reducerPath]`,
    initializer: `${apiNameDeclaration}.reducer`,
    kind: StructureKind.PropertyAssignment,
  });

  const middlewares = store.getVariableDeclarationOrThrow('middlewares');

  middlewares
    .getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
    .addElement(`${apiNameDeclaration}.middleware`);

  project.saveSync();

  await formatFiles(tree);
}

export default entityApiGenerator;
