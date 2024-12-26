import { execSync } from 'child_process';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  installPackagesTask,
  readJson,
  Tree,
  writeJson,
} from '@nx/devkit';
import { NextAppGeneratorSchema } from './schema';
import { existsSync } from 'fs';
import { dependencies } from '../../shared/dependencies';
import { BaseGeneratorType } from '../../shared/enums';
import { runApiClientGenerator, runAppEnvGenerator, runFormUtilsGenerator, runStoreGenerator } from '../../shared/generators';
import { addNxAppTag, askQuestion, formatName } from '../../shared/utils';
import * as path from 'path';

export async function nextAppGenerator(
  tree: Tree,
  options: NextAppGeneratorSchema,
) {
  const shouldGenerateStoreLib = await askQuestion('Do you want to create store lib? (y/n): ') === 'y';
  const shouldGenerateApiClientLib = shouldGenerateStoreLib && await askQuestion('Do you want to create api client lib? (y/n): ') === 'y';
  const shouldGenerateFormUtilsLib = await askQuestion('Do you want to create a lib with the form utils? (y/n): ') === 'y';

  const appRoot = `apps/${options.directory}`;
  const tags = [`app:${options.directory}`, 'type:app'];

  // Install @nx/next plugin
  execSync('npx nx add @nx/next', { stdio: 'inherit' });

  if (!existsSync(appRoot)) {
    execSync(
      `npx nx g @nx/next:app ${options.name} --directory=apps/${options.directory} --tags="${tags.join(', ')}" --linter=eslint --appDir=true --style=scss --src=false --unitTestRunner=none --e2eTestRunner=none`,
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

  if (shouldGenerateStoreLib) {
    await runStoreGenerator(tree, { ...options, baseGeneratorType: BaseGeneratorType.NEXT_APP });
  }

  if (shouldGenerateApiClientLib) {
    await runApiClientGenerator(tree, options);
  }

  if (shouldGenerateFormUtilsLib) {
    await runFormUtilsGenerator(tree, options);
  }

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${appRoot}/public/.gitkeep`);
  tree.delete(`${appRoot}/app/api`);
  tree.delete(`${appRoot}/app/page.tsx`);
  tree.delete(`${appRoot}/app/page.module.scss`);
  tree.delete(`${appRoot}/app/global.css`);
  tree.delete(`${appRoot}/app/layout.tsx`);
  tree.delete(`${appRoot}/specs`);
  tree.delete(`${appRoot}/.eslintrc.json`);

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
  });

  addNxAppTag(tree, options.directory);

  // Add dependencies
  addDependenciesToPackageJson(tree, dependencies['next-app'], {});

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
  };
}

export default nextAppGenerator;
