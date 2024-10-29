import { execSync } from 'child_process';
import * as path from 'path';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  installPackagesTask,
  readJson,
  Tree,
  writeJson,
} from '@nx/devkit';
import { ExpoAppGeneratorSchema } from './schema';
import scripts from './scripts';
import { existsSync, rmSync } from 'fs';
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
import {
  formatName,
  formatAppIdentifier,
  addNxAppTag,
  askQuestion,
  getImportPathPrefix,
} from '../../shared/utils';

export async function expoAppGenerator(
  tree: Tree,
  options: ExpoAppGeneratorSchema,
) {
  const appRoot = `apps/${options.directory}`;
  const i18nRoot = `i18n/${options.directory}`;
  const appTestFolder = `apps/${options.directory}-e2e`;
  const libPath = `${getImportPathPrefix(tree)}/${options.directory}`;
  const tags = [`app:${options.directory}`, 'type:app'];

  // Install @nx/expo plugin
  execSync('npx nx add @nx/expo', { stdio: 'inherit' });

  if (!existsSync(appRoot)) {
    execSync(
      `npx nx g @nx/expo:app ${options.name} --directory=apps/${options.directory} --tags="${tags.join(', ')}" --projectNameAndRootFormat=as-provided --unitTestRunner=none --e2eTestRunner=none`,
      { stdio: 'inherit' },
    );
  }

  // Generate shared libs
  await runAppEnvGenerator(tree, options);
  await runStorageGenerator(tree, options);
  await runRNStylesGenerator(tree, options);

  const shouldGenerateStoreLib =
    (await askQuestion('Do you want to create store lib? (y/n): ')) === 'y';

  if (shouldGenerateStoreLib) {
    await runStoreGenerator(tree, {
      ...options,
      baseGeneratorType: BaseGeneratorType.EXPO_APP,
    });
  }

  const shouldGenerateApiClientLib =
    shouldGenerateStoreLib &&
    (await askQuestion('Do you want to create api client lib? (y/n): ')) ===
      'y';

  if (shouldGenerateApiClientLib) {
    await runApiClientGenerator(tree, options);
  }

  const shouldGenerateAuthLibs =
    shouldGenerateApiClientLib &&
    (await askQuestion('Do you want to create auth lib? (y/n): ')) === 'y';

  const shouldGenerateFormUtilsLib =
    (await askQuestion(
      'Do you want to create a lib with the form utils? (y/n): ',
    )) === 'y';

  if (shouldGenerateFormUtilsLib) {
    await runFormUtilsGenerator(tree, options);
  }

  const shouldGenerateUIKittenLib =
    (await askQuestion('Do you want to install @ui-kitten? (y/n): ')) === 'y';

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
    formatDirectory: () => libPath,
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

  addDependenciesToPackageJson(
    tree,
    dependencies['expo-app'],
    devDependencies['expo-app'],
    appPackagePath,
  );

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
    execSync('npx expo install --fix', { stdio: 'inherit' });

    if (shouldGenerateAuthLibs) {
      execSync(`npx nx g auth ${options.name} ${options.directory}`, {
        stdio: 'inherit',
      });
    }
  };
}

export default expoAppGenerator;
