import { formatFiles, generateFiles, getProjects, Tree, output } from '@nx/devkit';
import * as path from 'path';
import { ReactLibGeneratorSchema } from './schema';
import { execSync } from 'child_process';
import { formatName, askQuestion, dynamicImport, filterSource, LibraryType, addNxScopeTag } from '../../shared/utils';
import { isBoolean } from 'lodash';
import { getLibDirectoryName } from './utils';

const getProjectsDetails = (tree: Tree) => Array.from(getProjects(tree))
  .filter(([_, project]) => project.projectType === 'application')
  .map(([name, project]) => ({ name, path: project.root }));

export async function reactLibGenerator(tree: Tree, options: ReactLibGeneratorSchema) {
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');
  const projects = getProjectsDetails(tree);

  if (!projects.length) {
    throw new Error('No application found. Create an application first.');
  }

  options.app = options.app || await autocomplete({
    message: 'Select the application: ',
    source: async (input) => {
      const entries = [...projects, { name: 'shared', path: 'shared' }].map((project) => ({
        name: `${project.name} (${project.path})`,
        value: project.path.replace('apps/', '')
      }));

      if (!input) {
        return entries;
      }

      return entries.filter((entry) => entry.name.toLowerCase().includes(input.toLowerCase()));
    }
  });

  const isSharedLib = options.app === 'shared';

  options.scope = options.scope || (isSharedLib ? '' : await askQuestion('Enter the scope (e.g: profile) or \'shared\': '));
  options.type = options.type || await autocomplete({
    message: 'Select the library type: ',
    source: (input) => filterSource(input, Object.values(LibraryType))
  });
  options.name = options.name || (await askQuestion('Enter the name of the library (e.g: settings): '));

  if ([LibraryType.FEATURES, LibraryType.UI].includes(options.type as LibraryType) && !isBoolean(options.withComponent)) {
    options.withComponent = (await askQuestion('Generate component inside lib folder? (y/n): ')) === 'y';

    if (!isBoolean(options.withComponentForwardRef)) {
      options.withComponentForwardRef = await askQuestion('Generate component with forwardRef? (y/n): ') === 'y';
    }
  }

  const scopeTag = options.scope || 'shared';
  const tags = [`app:${options.app}`, `scope:${scopeTag}`, `type:${options.type}`];

  const libDirectoryName = getLibDirectoryName(options.name, options.scope);
  const libPath = path.normalize(`libs/${options.app}/${options.scope}/${options.type}/${libDirectoryName}`);
  const command = `npx nx g @nx/expo:lib --skipPackageJson --unitTestRunner=none --tags="${tags.join(', ')}" --projectNameAndRootFormat=derived ${libPath}`;
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
    output.warn({ title: `The library directory was changed to ${output.bold(libDirectoryName)} so that it does not contain words from the scope name.`});
  }
}

export default reactLibGenerator;
