import { execSync } from 'child_process';
import * as path from 'path';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  installPackagesTask,
  readJson,
  Tree,
  writeJson
} from '@nx/devkit';
import { ExpoAppGeneratorSchema } from './schema';
import scripts from './scripts';
import { existsSync, rmSync } from 'fs';
import { dependencies, devDependencies } from '../../shared/dependencies';
import { BaseGeneratorType } from '../../shared/enums';
import { runStoreGenerator, runAppEnvGenerator, runApiClientGenerator, runAuthGenerator, runStorageGenerator, runRNStylesGenerator } from '../../shared/generators';
import { formatName, formatAppIdentifier } from '../../shared/utils';

export async function expoAppGenerator(
  tree: Tree,
  options: ExpoAppGeneratorSchema
) {
  const appRoot = `apps/${options.directory}`;
  const appTestFolder = `apps/${options.directory}-e2e`;
  const libPath = `@${options.name}/${options.directory}`;

  // Install @nx/expo plugin
  execSync('npx nx add @nx/expo', { stdio: 'inherit' })

  if (!existsSync(appRoot)) {
    execSync(
      `npx nx g @nx/expo:app ${options.name} --directory=apps/${options.directory} --projectNameAndRootFormat=as-provided --unitTestRunner=none --e2eTestRunner=none`,
      { stdio: 'inherit' }
    );
  }

  // Generate shared libs
  runStoreGenerator(tree, { ...options, baseGeneratorType: BaseGeneratorType.EXPO_APP });
  runAppEnvGenerator(tree, options);
  runApiClientGenerator(tree, options);
  runStorageGenerator(tree, options);
  runAuthGenerator(tree, options);
  runRNStylesGenerator(tree, options);

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
    isUIKittenEnabled: false,
    appDirectory: options.directory
  });

  // Add dependencies
  addDependenciesToPackageJson(
    tree,
    {
      ...dependencies['expo-app'],
      ...dependencies['expo-app-root']
    },
    {
      ...devDependencies['expo-app'],
      ...devDependencies['expo-app-root']
    }
  );

  addDependenciesToPackageJson(tree, dependencies['expo-app'], devDependencies['expo-app'], appPackagePath);

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
    execSync('npx expo install --fix', { stdio: 'inherit' });
    execSync(`npx nx g ui-kitten ${options.name} ${options.directory}`, { stdio: 'inherit' });
  };
}

export default expoAppGenerator;
