import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import { findInstalledPlugins } from 'nx/src/utils/plugins/installed-plugins';
import * as path from 'path';
import { ReactLibGeneratorSchema } from './schema';
import { execSync } from 'child_process';
import { LibraryPresetType } from '../../shared/enums';
import { formatName, getLibName, askQuestion } from '../../shared/utils';

const presetParams = {
  [LibraryPresetType.EXPO]: '',
  [LibraryPresetType.NEXT]: '--component=false --minimal=true --style=none'
};

export async function reactLibGenerator(
  tree: Tree,
  options: ReactLibGeneratorSchema
) {
  const installedModules = findInstalledPlugins().map((module) => module.name);
  const isExpoModuleAvailable = installedModules.includes('@nx/expo');
  const isNextModuleAvailable = installedModules.includes('@nx/next');

  if (!isExpoModuleAvailable && !isNextModuleAvailable) {
    throw new Error(
      `You need to have either @nx/expo or @nx/next installed in order to use this generator.`
    );
  }

  options.preset = options.preset || isExpoModuleAvailable ? LibraryPresetType.EXPO : LibraryPresetType.NEXT;

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
  const command = `npx nx g ${options.preset} --skipPackageJson --unitTestRunner=none --projectNameAndRootFormat=derived ${libPath} ${presetParams[options.preset]}`
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
