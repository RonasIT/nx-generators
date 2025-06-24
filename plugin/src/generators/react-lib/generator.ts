import { execSync } from 'child_process';
import * as path from 'path';
import { formatFiles, generateFiles, output, Tree } from '@nx/devkit';
import { isBoolean } from 'lodash';
import {
  addNxScopeTag,
  constants,
  formatName,
  LibraryType,
  selectProject,
  validateLibraryType,
  getLibDirectoryName,
  confirm,
  askQuestion,
} from '../../shared/utils';
import { ReactLibGeneratorSchema } from './schema';

export async function reactLibGenerator(tree: Tree, options: ReactLibGeneratorSchema): Promise<void> {
  const { AutoComplete } = require('enquirer');

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

  options.name = options.name || (await askQuestion('Enter the name of the library (e.g: settings): '));

  if (
    [LibraryType.FEATURES, LibraryType.UI].includes(options.type as LibraryType) &&
    !isBoolean(options.withComponent)
  ) {
    options.withComponent = await confirm('Generate component inside lib folder?');

    if (options.withComponent && !isBoolean(options.withComponentForwardRef)) {
      options.withComponentForwardRef = await confirm('Generate component with forwardRef?');
    }
  }

  const scopeTag = options.scope || constants.sharedValue;
  const tags = [`app:${options.app}`, `scope:${scopeTag}`, `type:${options.type}`];

  const libDirectoryName = getLibDirectoryName(options.name, options.scope);
  const libName = path
    .normalize(`${options.app}/${options.scope}/${options.type}/${libDirectoryName}`)
    .split(path.sep)
    .join('/');
  const libPath = `libs/${libName}`;
  const command = `npx nx g @nx/react:library --skipPackageJson --unitTestRunner=none --tags="${tags.join(', ')}" --name=${libName} ${libPath} --linter=eslint --component=false --bundler=none --style=scss`;
  const commandWithOptions = options.dryRun ? command + ' --dry-run' : command;

  execSync(commandWithOptions, { stdio: 'inherit' });

  if (options.withComponent) {
    const srcPath = `${libPath}/src`;
    generateFiles(tree, path.join(__dirname, 'files'), srcPath, { ...options, name: formatName(options.name, true) });
    tree.write(`${srcPath}/index.ts`, "export * from './lib';");
  }

  //Remove unnecessary tsconfig.lib.json
  tree.delete(`${libPath}/tsconfig.lib.json`);

  addNxScopeTag(tree, scopeTag);

  await formatFiles(tree);

  if (libDirectoryName !== options.name) {
    output.warn({
      title: `The library directory was changed to ${output.bold(libDirectoryName)} so that it does not start with the scope name.`,
    });
  }
}

export default reactLibGenerator;
