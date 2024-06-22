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
import { existsSync } from 'fs';
import { formatName } from '../../shared/utils';

const dependencies = {
  'expo-constants': '~16.0.2',
  'expo-router': '~3.5.16',
  'react-native-safe-area-context': '^4.10.5',
  'react-native-screens': '^3.32.0',
  'expo-linking': '^6.3.1',
  'expo-status-bar': '^1.12.1',
  'expo-updates': '^0.25.17',
  'expo-insights': '~0.7.0',
};

export async function expoAppGenerator(
  tree: Tree,
  options: ExpoAppGeneratorSchema
) {
  const appRoot = `apps/${options.directory}`;

  if (!existsSync(appRoot)) {
    execSync(
      `npx nx g app ${options.name} --directory=apps/${options.directory} --projectNameAndRootFormat=as-provided --unitTestRunner=none --e2eTestRunner=none`
    );
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

  // Update app package.json
  const appPackageJson = readJson(tree, appPackagePath);
  appPackageJson.main = 'expo-router/entry';
  appPackageJson.scripts = {
    ...scripts,
    ...appPackageJson.scripts,
  };
  writeJson(tree, appPackagePath, appPackageJson);

  // Add app files
  generateFiles(tree, path.join(__dirname, 'files'), appRoot, {
    ...options,
    formatName,
  });

  // Add dependencies
  addDependenciesToPackageJson(
    tree,
    {
      ...dependencies,
      // Need new version to fix this error:
      // https://github.com/kristerkari/react-native-svg-transformer/issues/329
      'react-native-svg-transformer': '^1.4.0',
    },
    { 'cross-env': '^7.0.3' }
  );

  addDependenciesToPackageJson(tree, dependencies, {}, appPackagePath);

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
    execSync('npx expo install --fix', { stdio: 'inherit' });
  };
}

export default expoAppGenerator;
