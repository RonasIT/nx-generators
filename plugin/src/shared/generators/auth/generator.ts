import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import { addDependenciesToPackageJson, formatFiles, generateFiles, installPackagesTask, Tree } from '@nx/devkit';
import { IndentationText, Project, QuoteKind, StructureKind, SyntaxKind } from 'ts-morph';
import { dependencies, devDependencies } from '../../dependencies';
import { BaseGeneratorType } from '../../enums';
import { formatAppIdentifier, formatName, getImportPathPrefix, searchAliasPath } from '../../utils';
import { AuthGeneratorSchema } from './schema';

const updateStore = (libRoot: string, workspaceRoot = process.cwd()): void => {
  const project = new Project({
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      quoteKind: QuoteKind.Single,
    },
  });

  const storePath = path.join(workspaceRoot, libRoot, 'shared/data-access/store/src/store.ts');
  const store = project.addSourceFileAtPath(storePath);
  const apiAlias = searchAliasPath(path.join(workspaceRoot, libRoot, 'shared/data-access/api/src'), workspaceRoot);
  const authAlias = searchAliasPath(path.join(workspaceRoot, libRoot, 'shared/data-access/auth/src'), workspaceRoot);

  if (!apiAlias) {
    throw new Error('Could not find API library.');
  }

  if (!authAlias) {
    throw new Error('Could not find Auth library.');
  }

  store.addImportDeclarations([
    { moduleSpecifier: apiAlias, namedImports: ['authApi', 'profileApi'] },
    { moduleSpecifier: authAlias, namedImports: ['authListenerMiddleware', 'authReducer', 'authReducerPath'] },
  ]);

  const rootReducer = store.getVariableDeclarationOrThrow('rootReducer');

  rootReducer.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression).addProperties([
    { name: '[authApi.reducerPath]', initializer: 'authApi.reducer', kind: StructureKind.PropertyAssignment },
    { name: '[authReducerPath]', initializer: 'authReducer', kind: StructureKind.PropertyAssignment },
    { name: '[profileApi.reducerPath]', initializer: 'profileApi.reducer', kind: StructureKind.PropertyAssignment },
  ]);

  const middlewares = store.getVariableDeclarationOrThrow('middlewares');

  middlewares
    .getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
    .addElements(['authApi.middleware', 'authListenerMiddleware.middleware', 'profileApi.middleware'], {
      useNewLines: true,
    });

  project.saveSync();
};

export async function runAuthGenerator(tree: Tree, options: AuthGeneratorSchema, workspaceRoot = process.cwd()) {
  const appRoot = `apps/${options.directory}`;
  const libRoot = `libs/${options.directory}`;
  const libPath = `${getImportPathPrefix(tree)}/${options.directory}`;

  // Generate shared libs
  execSync(`npx nx g react-lib --app=${options.directory} --scope=shared --type=data-access --name=api`, {
    stdio: 'inherit',
  });
  execSync(`npx nx g react-lib --app=${options.directory} --scope=shared --type=data-access --name=auth`, {
    stdio: 'inherit',
  });

  if (options.type === BaseGeneratorType.NEXT_APP) {
    execSync(`npx nx g react-lib --app=${options.directory} --scope=shared --type=data-access --name=cookie`, {
      stdio: 'inherit',
    });
  }

  const appPackagePath = `${appRoot}/package.json`;

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${libRoot}/shared/data-access/api/src/index.ts`);
  tree.delete(`${libRoot}/shared/data-access/auth/src/index.ts`);

  // Add lib files
  generateFiles(tree, path.join(__dirname, '/common-files'), libRoot, {
    ...options,
    formatName,
    formatAppIdentifier,
    libPath,
  });

  if (options.type === BaseGeneratorType.NEXT_APP) {
    generateFiles(tree, path.join(__dirname, '/next-libs-files'), libRoot, {});
    generateFiles(tree, path.join(__dirname, '/next-app-files'), appRoot, { libPath });
  }

  updateStore(libRoot, workspaceRoot);

  // Add dependencies to root package.json
  addDependenciesToPackageJson(tree, dependencies['auth'], devDependencies['auth']);

  if (options.type === BaseGeneratorType.NEXT_APP) {
    addDependenciesToPackageJson(tree, dependencies['next-auth'], devDependencies['next-auth']);
  }

  // Add dependencies to app package.json
  if (existsSync(appPackagePath)) {
    addDependenciesToPackageJson(tree, dependencies['auth'], devDependencies['auth'], appPackagePath);

    if (options.type === BaseGeneratorType.NEXT_APP) {
      addDependenciesToPackageJson(tree, dependencies['next-auth'], devDependencies['next-auth'], appPackagePath);
    }
  }

  await formatFiles(tree);

  return (): void => {
    installPackagesTask(tree);
  };
}

export default runAuthGenerator;
