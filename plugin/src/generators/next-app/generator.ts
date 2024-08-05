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
import { BaseGeneratorType } from '../../shared/enums';
import { runApiClientGenerator, runAppEnvGenerator, runStoreGenerator } from '../../shared/generators';
import { formatName } from '../../shared/utils';
import * as path from 'path';

const dependencies = {
  'next-intl': '^3.17.2',
};

export async function nextAppGenerator(
  tree: Tree,
  options: NextAppGeneratorSchema,
) {
  const appRoot = `apps/${options.directory}`;

  // Install @nx/next plugin
  execSync('npx nx add @nx/next', { stdio: 'inherit' });

  if (!existsSync(appRoot)) {
    execSync(
      `npx nx g @nx/next:app ${options.name} --directory=apps/${options.directory} --projectNameAndRootFormat=as-provided --appDir=true --style=scss --src=false --unitTestRunner=none --e2eTestRunner=none`,
      { stdio: 'inherit' },
    );
  }

  runStoreGenerator(tree, { ...options, baseGeneratorType: BaseGeneratorType.NEXT_APP });
  runAppEnvGenerator(tree, options);
  runApiClientGenerator(tree, options);

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${appRoot}/public/.gitkeep`);
  tree.delete(`${appRoot}/app/api`);
  tree.delete(`${appRoot}/app/page.tsx`);
  tree.delete(`${appRoot}/app/page.module.scss`);
  tree.delete(`${appRoot}/app/global.css`);
  tree.delete(`${appRoot}/app/layout.tsx`);
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

  // Add dependencies
  addDependenciesToPackageJson(tree, dependencies, {});

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
  };
}

export default nextAppGenerator;
