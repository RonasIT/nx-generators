import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import * as path from 'path';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  installPackagesTask,
  readJson,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
  writeJson,
} from '@nx/devkit';
import { dependencies, devDependencies } from '../../shared/dependencies';
import { BaseGeneratorType } from '../../shared/enums';
import {
  runAppEnvGenerator,
  runApiClientGenerator,
  runStorageGenerator,
  runRNStylesGenerator,
  runFormUtilsGenerator,
  runStoreGenerator,
  runUIKittenGenerator,
  runNavigationUtilsGenerator,
} from '../../shared/generators';
import { formatName, formatAppIdentifier, addNxAppTag, getImportPathPrefix, confirm } from '../../shared/utils';
import { ExpoAppGeneratorSchema } from './schema';
import scripts from './scripts';

export async function expoAppGenerator(tree: Tree, options: ExpoAppGeneratorSchema) {
  const shouldGenerateApiClientLib = options.withStore && (await confirm('Do you want to create api client lib?'));
  const shouldGenerateAuthLibs = shouldGenerateApiClientLib && (await confirm('Do you want to create auth lib?'));

  const appRoot = `apps/${options.directory}`;
  const i18nRoot = `i18n/${options.directory}`;
  const appTestFolder = `apps/${options.directory}-e2e`;
  const libPath = `${getImportPathPrefix(tree)}/${options.directory}`;
  const tags = [`app:${options.directory}`, 'type:app'];

  // Install @nx/expo plugin
  execSync('npx nx add @nx/expo', { stdio: 'inherit' });

  if (existsSync(appRoot)) {
    const project = readProjectConfiguration(tree, options.directory);

    project.tags = [`app:${options.directory}`, 'type:app'];

    updateProjectConfiguration(tree, project.name as string, project);
  } else {
    execSync(
      `npx nx g @nx/expo:app ${options.name} --directory=apps/${options.directory} --tags="${tags.join(', ')}" --linter=none --unitTestRunner=none --e2eTestRunner=none`,
      { stdio: 'inherit' },
    );
  }

  // Generate shared libs
  await runAppEnvGenerator(tree, { ...options, baseGeneratorType: BaseGeneratorType.EXPO_APP });
  await runStorageGenerator(tree, options);
  await runRNStylesGenerator(tree, options);
  await runNavigationUtilsGenerator(tree, {
    appDirectory: options.directory,
    baseGeneratorType: BaseGeneratorType.EXPO_APP,
  });

  if (options.withStore) {
    await runStoreGenerator(tree, {
      ...options,
      baseGeneratorType: BaseGeneratorType.EXPO_APP,
    });
  }

  if (shouldGenerateApiClientLib) {
    await runApiClientGenerator(tree, options);
  }

  if (options.withFormUtils) {
    await runFormUtilsGenerator(tree, options);
  }

  if (options.withUIKitten) {
    await runUIKittenGenerator(tree, options);
  }

  // Workaround: Even with the '--e2eTestRunner=none' parameter, the test folder is created. We delete it manually.
  if (existsSync(appTestFolder)) {
    rmSync(appTestFolder, { recursive: true, force: true });
  }

  const appPackagePath = `${appRoot}/package.json`;

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${appRoot}/src`);
  tree.delete(`${appRoot}/index.js`);
  tree.delete(`${appRoot}/webpack.config.js`);
  tree.delete(`${appRoot}/.eslintrc.json`);
  tree.delete(`${appRoot}/eslint.config.cjs`);
  tree.delete(`${appRoot}/eslint.config.mjs`);
  tree.delete(`${appRoot}/app.json`);
  tree.delete(`${appRoot}/eas.json`);
  tree.delete(`${appRoot}/metro.config.js`);
  tree.delete(`${appRoot}/jest.config.ts`);

  // Update app package.json
  const appPackageJson = readJson(tree, appPackagePath);
  appPackageJson.main = 'expo-router/entry';
  appPackageJson.scripts = {
    ...scripts,
    ...appPackageJson.scripts,
  };
  writeJson(tree, appPackagePath, appPackageJson);

  // Add app files
  generateFiles(tree, path.join(__dirname, 'app-files'), appRoot, {
    ...options,
    formatName,
    formatAppIdentifier,
    libPath,
    isUIKittenEnabled: options.withUIKitten,
    isStoreEnabled: options.withStore,
    appDirectory: options.directory,
  });

  tree.delete(`${appRoot}/tsconfig.app.json`);

  addNxAppTag(tree, options.directory);
  generateFiles(tree, path.join(__dirname, 'i18n'), i18nRoot, {});

  // Add dependencies
  addDependenciesToPackageJson(tree, dependencies['expo-app'], devDependencies['expo-app']);

  addDependenciesToPackageJson(tree, dependencies['expo-app'], devDependencies['expo-app'], appPackagePath);

  await formatFiles(tree);

  return (): void => {
    installPackagesTask(tree);
    execSync('npx expo install --fix', { stdio: 'inherit' });

    if (shouldGenerateAuthLibs) {
      execSync(`npx nx g auth ${options.directory}`, {
        stdio: 'inherit',
      });
    }

    if (options.withSentry) {
      execSync(`npx nx g sentry --directory=${appRoot}`, {
        stdio: 'inherit',
      });
    }

    execSync('npx nx g lib-tags --skipRepoCheck', { stdio: 'inherit' });
  };
}

export default expoAppGenerator;
