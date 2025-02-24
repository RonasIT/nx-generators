import { execSync } from 'child_process';
import { existsSync } from 'fs';
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
import { dependencies, devDependencies } from '../../shared/dependencies';
import { BaseGeneratorType } from '../../shared/enums';
import {
  runApiClientGenerator,
  runAppEnvGenerator,
  runFormUtilsGenerator,
  runStoreGenerator,
  runI18nNextGenerator,
} from '../../shared/generators';
import { addNxAppTag, askQuestion, formatName, getImportPathPrefix } from '../../shared/utils';
import { NextAppGeneratorSchema } from './schema';

export async function nextAppGenerator(tree: Tree, options: NextAppGeneratorSchema) {
  const shouldGenerateStoreLib = (await askQuestion('Do you want to create store lib? (y/n): ')) === 'y';
  const shouldGenerateApiClientLib =
    shouldGenerateStoreLib && (await askQuestion('Do you want to create api client lib? (y/n): ')) === 'y';
  const shouldGenerateFormUtilsLib =
    (await askQuestion('Do you want to create a lib with the form utils? (y/n): ')) === 'y';

  const appRoot = `apps/${options.directory}`;
  const i18nRoot = `i18n/${options.directory}`;
  const libPath = `${getImportPathPrefix(tree)}/${options.directory}`;
  const tags = [`app:${options.directory}`, 'type:app'];

  // Install @nx/next plugin
  execSync('npx nx add @nx/next', { stdio: 'inherit' });

  if (!existsSync(appRoot)) {
    execSync(
      `npx nx g @nx/next:app ${options.name} --directory=apps/${options.directory} --tags="${tags.join(', ')}" --linter=none --appDir=true --style=scss --src=false --unitTestRunner=none --e2eTestRunner=none`,
      { stdio: 'inherit' },
    );
  }

  // Install @nx/expo to generate libs
  const packageJson = readJson(tree, 'package.json');
  const hasNxExpo = !!packageJson.devDependencies['@nx/expo'];

  if (!hasNxExpo) {
    execSync('npx nx add @nx/expo', { stdio: 'inherit' });
  }

  await runAppEnvGenerator(tree, { ...options, baseGeneratorType: BaseGeneratorType.NEXT_APP });
  await runI18nNextGenerator(tree, options);

  if (shouldGenerateStoreLib) {
    await runStoreGenerator(tree, {
      ...options,
      baseGeneratorType: BaseGeneratorType.NEXT_APP,
    });
  }

  if (shouldGenerateApiClientLib) {
    await runApiClientGenerator(tree, options);
  }

  if (shouldGenerateFormUtilsLib) {
    await runFormUtilsGenerator(tree, options);
  }

  const hasProviders = shouldGenerateStoreLib;

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${appRoot}/public/.gitkeep`);
  tree.delete(`${appRoot}/app/api`);
  tree.delete(`${appRoot}/app/page.tsx`);
  tree.delete(`${appRoot}/app/page.module.scss`);
  tree.delete(`${appRoot}/app/global.css`);
  tree.delete(`${appRoot}/app/layout.tsx`);
  tree.delete(`${appRoot}/specs`);
  tree.delete(`${appRoot}/eslint.config.cjs`);
  tree.delete(`${appRoot}/eslint.config.mjs`);

  // Update app tsconfig.json to skip automatic reconfiguration during the first application run
  const appTsconfigPath = `${appRoot}/tsconfig.json`;
  const appTsconfigJson = readJson(tree, appTsconfigPath);
  const nextTypesInclude = '.next/types/**/*.ts';

  if (!appTsconfigJson.include.includes(nextTypesInclude)) {
    appTsconfigJson.include.push(nextTypesInclude);
    writeJson(tree, appTsconfigPath, appTsconfigJson);
  }

  // Add app files
  generateFiles(tree, path.join(__dirname, 'files'), appRoot, {
    ...options,
    formatName,
    formatDirectory: () => libPath,
    hasProviders,
    isStoreEnabled: shouldGenerateStoreLib
  });

  if (!hasProviders) {
    tree.delete(`${appRoot}/app/[locale]/providers.tsx`);
  }

  addNxAppTag(tree, options.directory);
  generateFiles(tree, path.join(__dirname, 'i18n'), i18nRoot, {
    ...options,
    formatName
  });

  // Add dependencies
  addDependenciesToPackageJson(tree, dependencies['next-app'], devDependencies['next-app']);

  await formatFiles(tree);

  return (): void => {
    installPackagesTask(tree);

    if (options.withSentry) {
      execSync(`npx nx g sentry --directory=${appRoot}`, {
        stdio: 'inherit',
      });
    }
  };
}

export default nextAppGenerator;
