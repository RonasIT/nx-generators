import { formatFiles, generateFiles, output, Tree } from '@nx/devkit';
import * as path from 'path';
import { ReactLibGeneratorSchema } from './schema';
import { execSync } from 'child_process';
import {
  addNxScopeTag,
  askQuestion,
  constants,
  dynamicImport,
  filterSource,
  formatName,
  LibraryType,
  selectProject,
  validateLibraryType,
  getLibDirectoryName, createCliReadline
} from '../../shared/utils';
import { isBoolean } from 'lodash';

export async function reactLibGenerator(tree: Tree, options: ReactLibGeneratorSchema) {
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');

  options.app = options.app || (await selectProject(tree, 'application', 'Select the application: ')).name;

  const isSharedLib = options.app === constants.sharedValue;

  options.scope = options.scope || (isSharedLib ? '' : await askQuestion(`Enter the scope (e.g: profile) or '${constants.sharedValue}': `));
  options.type = options.type ? validateLibraryType(options.type) : await autocomplete({
    message: 'Select the library type: ',
    source: (input) => filterSource(input as string, Object.values(LibraryType))
  });

  const cliReadline = createCliReadline()
  options.name = options.name || (await askQuestion('Enter the name of the library (e.g: settings): ', null, cliReadline));

  if ([LibraryType.FEATURES, LibraryType.UI].includes(options.type as LibraryType) && !isBoolean(options.withComponent)) {
    options.withComponent = (await askQuestion('Generate component inside lib folder? (y/n): ', null, cliReadline)) === 'y';

    if (options.withComponent && !isBoolean(options.withComponentForwardRef)) {
      options.withComponentForwardRef = await askQuestion('Generate component with forwardRef? (y/n): ', null, cliReadline) === 'y';
    }
  }
  cliReadline.close();

  const scopeTag = options.scope || constants.sharedValue;
  const tags = [`app:${options.app}`, `scope:${scopeTag}`, `type:${options.type}`];

  const libDirectoryName = getLibDirectoryName(options.name, options.scope);
  const libName = path.normalize(`${options.app}/${options.scope}/${options.type}/${libDirectoryName}`);
  const libPath = `libs/${libName}`;
  const command = `npx nx g @nx/expo:lib --skipPackageJson --unitTestRunner=none --tags="${tags.join(', ')}" --name=${libName} ${libPath} --linter=eslint`;
  const commandWithOptions = options.dryRun ? command + ' --dry-run' : command;

  execSync(commandWithOptions, { stdio: 'inherit' });

  if (options.withComponent) {
    const srcPath = `${libPath}/src`;

    generateFiles(tree, path.join(__dirname, 'files'), srcPath, { ...options, name: formatName(options.name, true) });
    tree.write(`${srcPath}/index.ts`, 'export * from \'./lib\';');
  }

  addNxScopeTag(tree, scopeTag);

  await formatFiles(tree);

  if (libDirectoryName !== options.name) {
    output.warn({ title: `The library directory was changed to ${output.bold(libDirectoryName)} so that it does not start with the scope name.`});
  }
}

export default reactLibGenerator;
