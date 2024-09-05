import { formatFiles, generateFiles, getProjects, Tree } from '@nx/devkit';
import * as path from 'path';
import { ReactLibGeneratorSchema } from './schema';
import { execSync } from 'child_process';
import { formatName, getLibName, askQuestion, dynamicImport, filterSource, LibraryType } from '../../shared/utils';

const getProjectsDetails = (tree: Tree) => Array.from(getProjects(tree))
  .filter(([_, project]) => project.projectType === 'application')
  .map(([name, project]) => ({ name, path: project.root }));

export async function reactLibGenerator(
  tree: Tree,
  options: ReactLibGeneratorSchema
) {
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');
  const projects = getProjectsDetails(tree);

  if (!projects.length) {
    throw new Error('No application found. Create an application first.');
  }

  if (!options.directory) {
    options.app = options.app || await autocomplete({
      message: 'Select the application: ',
      source: async (input) => {
        const entries = [...projects, { name: 'Shared', path: 'shared' }].map((project) => ({
          name: `${project.name} (${project.path})`,
          value: project.path.replace('apps/', '')
        }));

        if (!input) {
          return entries;
        }

        return entries.filter((entry) => entry.name.toLowerCase().includes(input.toLowerCase()));
      }
    });
    options.scope = options.scope || await askQuestion('Enter the scope (e.g: profile) or \'shared\': ');
    options.type = options.type || await autocomplete({
      message: 'Select the library type: ',
      source: (input) => filterSource(input, Object.values(LibraryType))
    });
    options.name = options.name || await askQuestion('Enter the name of the library (e.g: profile-settings): ');
    options.withComponent = options.withComponent || await askQuestion('Generate component inside lib folder? (y/n): ') === 'y';
  }

  const libPath = options.directory
    ? `libs/${options.directory}`
    : `libs/${options.app}/${options.scope}/${options.type}/${options.name}`;
  const command = `npx nx g @nx/expo:lib --skipPackageJson --unitTestRunner=none --projectNameAndRootFormat=derived ${libPath}`
  const commandWithOptions = options.dryRun ? command + ' --dry-run' : command

  execSync(commandWithOptions, { stdio: 'inherit' });

  if (options.withComponent) {
    const srcPath = `${libPath}/src`
    generateFiles(tree, path.join(__dirname, 'files'), srcPath, { ...options, name: getLibName(libPath), formatName });
    tree.write(`${srcPath}/index.ts`, 'export * from \'./lib\';');
  }

  await formatFiles(tree);
}

export default reactLibGenerator;
