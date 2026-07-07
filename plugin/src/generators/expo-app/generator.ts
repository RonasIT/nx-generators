import { execSync } from 'child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import * as path from 'path';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  installPackagesTask,
  readJson,
  removeDependenciesFromPackageJson,
  Tree,
  writeJson,
} from '@nx/devkit';
import { dependencies, devDependencies } from '../../shared/dependencies';
import { BaseGeneratorType } from '../../shared/enums';
import {
  runApiClientGenerator,
  runAppEnvGenerator,
  runFormUtilsGenerator,
  runNavigationUtilsGenerator,
  runRNStylesGenerator,
  runUiKitGenerator,
  runStorageGenerator,
  runStoreGenerator,
} from '../../shared/generators';
import { addNxAppTag, confirm, formatAppIdentifier, formatName, getImportPathPrefix } from '../../shared/utils';
import { generateEasignore } from './easignore';
import { ExpoAppGeneratorSchema } from './schema';
import scripts from './scripts';

const notRequiredDependencies = ['expo-system-ui'];
const npmrcPath = '.npmrc';
const legacyPeerDepsLine = 'legacy-peer-deps=true';

// Workaround: @nx/expo:app installs its own Expo version before we override it with a newer one,
// which causes an ERESOLVE conflict on the next install. This toggles legacy-peer-deps for the
// duration of the generator so npm doesn't fail reconciling the two installs.
function setLegacyPeerDeps(value: boolean): void {
  const content = existsSync(npmrcPath) ? readFileSync(npmrcPath, 'utf-8') : '';
  const lines = content.split('\n').filter((line) => line.trim() !== '' && line.trim() !== legacyPeerDepsLine);

  if (value) {
    lines.push(legacyPeerDepsLine);
  }

  writeFileSync(npmrcPath, `${lines.join('\n')}\n`);
}

export async function expoAppGenerator(tree: Tree, options: ExpoAppGeneratorSchema) {
  const shouldGenerateApiClientLib = options.withStore && (await confirm('Do you want to create api client lib?'));
  const shouldGenerateAuthLibs = shouldGenerateApiClientLib && (await confirm('Do you want to create auth lib?'));

  const appRoot = `apps/${options.directory}`;
  const i18nRoot = `i18n/${options.directory}`;
  const appTestFolder = `apps/${options.directory}-e2e`;
  const libPath = `${getImportPathPrefix(tree)}/${options.directory}`;
  const tags = [`app:${options.directory}`, 'type:app'];

  setLegacyPeerDeps(true);

  try {
    // Install @nx/expo plugin
    execSync('npx nx add @nx/expo', { stdio: 'inherit' });

    if (!existsSync(appRoot)) {
      execSync(
        `npx nx g @nx/expo:app ${options.name} --directory=apps/${options.directory} --tags="${tags.join(', ')}" --linter=none --unitTestRunner=none --e2eTestRunner=none`,
        { stdio: 'inherit' },
      );
    }

    // Generate shared libs
    await runAppEnvGenerator(tree, options);
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
      await runApiClientGenerator(tree, { ...options, type: BaseGeneratorType.EXPO_APP });
    }

    if (options.withFormUtils) {
      await runFormUtilsGenerator(tree, options);
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

    // Remove dependencies with version "*" from @nx/expo template and not required
    const dependenciesWithoutVersion = Object.keys(appPackageJson.dependencies || {}).filter((dependency) =>
      appPackageJson.dependencies[dependency].includes('*'),
    );
    const dependenciesToRemove = [...dependenciesWithoutVersion, ...notRequiredDependencies];
    removeDependenciesFromPackageJson(tree, dependenciesToRemove, [], appPackagePath);
    removeDependenciesFromPackageJson(tree, notRequiredDependencies, [], 'package.json');

    // Add app files
    generateFiles(tree, path.join(__dirname, 'app-files'), appRoot, {
      ...options,
      formatName,
      formatAppIdentifier,
      libPath,
      isStoreEnabled: options.withStore,
      appDirectory: options.directory,
    });

    generateEasignore(tree, options.directory);

    tree.delete(`${appRoot}/tsconfig.app.json`);

    addNxAppTag(tree, options.directory);
    generateFiles(tree, path.join(__dirname, 'i18n'), i18nRoot, {});

    // Generate ui-kit files after app files to avoid conflicts and prevent overwriting
    if (options.withUiKit) {
      await runUiKitGenerator(tree, options);
    }

    // Add dependencies
    addDependenciesToPackageJson(tree, dependencies['expo-app'], devDependencies['expo-app']);
    addDependenciesToPackageJson(tree, dependencies['expo-app'], devDependencies['expo-app'], appPackagePath);

    await formatFiles(tree);
  } catch (error) {
    setLegacyPeerDeps(false);

    throw error;
  }

  return (): void => {
    try {
      installPackagesTask(tree);

      if (shouldGenerateAuthLibs) {
        execSync(`npx nx g auth --directory=${options.directory} --type=${BaseGeneratorType.EXPO_APP}`, {
          stdio: 'inherit',
        });
      }

      if (options.withSentry) {
        execSync(`npx nx g sentry --directory=${appRoot}`, {
          stdio: 'inherit',
        });
      }

      execSync('npx nx g lib-tags --skipRepoCheck', { stdio: 'inherit' });
      execSync('npx expo install --fix', { stdio: 'inherit' });
    } finally {
      setLegacyPeerDeps(false);
    }
  };
}

export default expoAppGenerator;
