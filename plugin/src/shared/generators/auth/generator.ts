import { execSync } from 'child_process';
import * as path from 'path';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  installPackagesTask,
  Tree
} from '@nx/devkit';
import { dependencies, devDependencies } from '../../dependencies';
import { formatName, formatAppIdentifier, searchAliasPath, getImportPathPrefix } from '../../utils';
import { existsSync } from 'fs';
import { IndentationText, Project, QuoteKind, StructureKind, SyntaxKind } from 'ts-morph';
import { AuthGeneratorSchema } from './schema';

const updateStore = (libRoot: string): void => {
  const project = new Project({
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      quoteKind: QuoteKind.Single
    }
  });

  const storePath = `${libRoot}/shared/data-access/store/src`;
  const apiPath = `${libRoot}/shared/data-access/api/src`;
  const authPath = `${libRoot}/shared/data-access/auth/src`;
  const store = project.addSourceFileAtPath(`${storePath}/store.ts`);
  const apiAlias = searchAliasPath(apiPath);
  const authAlias = searchAliasPath(authPath);

  store.addImportDeclarations([
    { moduleSpecifier: apiAlias, namedImports: ['authApi', 'profileApi'] },
    { moduleSpecifier: authAlias, namedImports: [ 'authListenerMiddleware', 'authReducer', 'authReducerPath'] }
  ]);

  const rootReducer = store.getVariableDeclarationOrThrow('rootReducer');

  rootReducer.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
    .addProperties([
      { name: '[authApi.reducerPath]', initializer: 'authApi.reducer', kind: StructureKind.PropertyAssignment },
      { name: '[authReducerPath]', initializer: 'authReducer', kind: StructureKind.PropertyAssignment },
      { name: '[profileApi.reducerPath]', initializer: 'profileApi.reducer', kind: StructureKind.PropertyAssignment }
    ]);

  const middlewares = store.getVariableDeclarationOrThrow('middlewares');

  middlewares.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
    .addElements([
      'authApi.middleware',
      'authListenerMiddleware.middleware',
      'profileApi.middleware'
    ], { useNewLines: true });

  project.saveSync();
};

export async function runAuthGenerator(
  tree: Tree,
  options: AuthGeneratorSchema
) {
  const appRoot = `apps/${options.directory}`;
  const libRoot = `libs/${options.directory}`;
  const libPath = `${getImportPathPrefix(tree)}/${options.directory}`;

  // Generate shared libs
  execSync(`npx nx g react-lib --app=${options.directory} --scope=shared --type=data-access --name=api`, { stdio: 'inherit' });
  execSync(`npx nx g react-lib --app=${options.directory} --scope=shared --type=data-access --name=auth`, { stdio: 'inherit' });

  const appPackagePath = `${appRoot}/package.json`;

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${libRoot}/shared/data-access/api/src/index.ts`);
  tree.delete(`${libRoot}/shared/data-access/auth/src/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, '/lib-files'), libRoot, {
    ...options,
    formatName,
    formatAppIdentifier,
    formatDirectory: () => libPath
  });

  updateStore(libRoot);

  // Add dependencies
  addDependenciesToPackageJson(tree, dependencies['auth'], devDependencies['auth']);

  if (existsSync(appPackagePath)) {
    addDependenciesToPackageJson(tree, dependencies['auth'], devDependencies['auth'], appPackagePath);
  }

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
  };
}

export default runAuthGenerator;
