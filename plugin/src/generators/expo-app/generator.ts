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
} from '../../shared/generators';
import { formatName, formatAppIdentifier, addNxAppTag, askQuestion, getImportPathPrefix } from '../../shared/utils';
import { ExpoAppGeneratorSchema } from './schema';
import scripts from './scripts';

export async function expoAppGenerator(tree: Tree, options: ExpoAppGeneratorSchema) {
  const shouldGenerateStoreLib = (await askQuestion('Do you want to create store lib? (y/n): ')) === 'y';
  const shouldGenerateApiClientLib =
    shouldGenerateStoreLib && (await askQuestion('Do you want to create api client lib? (y/n): ')) === 'y';
  const shouldGenerateAuthLibs =
    shouldGenerateApiClientLib && (await askQuestion('Do you want to create auth lib? (y/n): ')) === 'y';
  const shouldGenerateFormUtilsLib =
    (await askQuestion('Do you want to create a lib with the form utils? (y/n): ')) === 'y';
  const shouldGenerateUIKittenLib = (await askQuestion('Do you want to install @ui-kitten? (y/n): ')) === 'y';

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

  if (shouldGenerateStoreLib) {
    await runStoreGenerator(tree, {
      ...options,
      baseGeneratorType: BaseGeneratorType.EXPO_APP,
    });
  }

  if (shouldGenerateApiClientLib) {
    await runApiClientGenerator(tree, options);
  }

  if (shouldGenerateFormUtilsLib) {
    await runFormUtilsGenerator(tree, options);
  }

  if (shouldGenerateUIKittenLib) {
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
  tree.delete(`${appRoot}/app.json`);
  tree.delete(`${appRoot}/eas.json`);
  tree.delete(`${appRoot}/metro.config.js`);
  tree.delete(`${appRoot}/jest.config.ts`);
  tree.delete(`${appRoot}/tsconfig.app.json`);

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
    isUIKittenEnabled: shouldGenerateUIKittenLib,
    isStoreEnabled: shouldGenerateStoreLib,
    appDirectory: options.directory,
  });

  addNxAppTag(tree, options.directory);
  generateFiles(tree, path.join(__dirname, 'i18n'), i18nRoot, {});

  // Add dependencies
  addDependenciesToPackageJson(
    tree,
    {
      ...dependencies['expo-app'],
      ...dependencies['expo-app-root'],
    },
    {
      ...devDependencies['expo-app'],
      ...devDependencies['expo-app-root'],
    },
  );

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
