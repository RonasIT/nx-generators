import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { ReactLibGeneratorSchema } from './schema';
import { execSync } from 'child_process';
import { formatName, getLibName, askQuestion } from '../../shared/utils';

export async function reactLibGenerator(
  tree: Tree,
  options: ReactLibGeneratorSchema
) {
  if (!options.directory) {
    options.app = options.app || await askQuestion('Enter the name of the app (e.g: mobile) or \'shared\': ');
    options.scope = options.scope || await askQuestion('Enter the scope (e.g: profile) or \'shared\': ');
    options.type = options.type || await askQuestion('Enter the type (utils, ui, data-access or features): ');
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
