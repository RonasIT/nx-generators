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
  'expo-constants': '^15.4.5',
  'expo-router': '^3.4.8',
  'react-native-safe-area-context': '^4.8.2',
  'react-native-screens': '^3.29.0',
  'expo-linking': '^6.2.2',
  'expo-status-bar': '^1.11.1',
  'expo-updates': '^0.24.11',
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
      'react-native-svg-transformer': '^1.3.0',
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
