import { execSync } from 'child_process';
import { createRequire } from 'node:module';
import * as path from 'path';
import { formatFiles, generateFiles, GeneratorCallback, getProjects, Tree } from '@nx/devkit';
import { isBoolean } from 'lodash';
import { scaffoldTestSuite } from '../../shared/generators/next-tests/suites';
import { createTestWorkspace } from '../../shared/generators/next-tests/workspace';
import {
  addNxScopeTag,
  askQuestion,
  confirm,
  constants,
  formatName,
  isNextApp,
  LibraryType,
  normalizeLibPath,
  runWithMinReleaseAgeDisabled,
  selectProject,
  validateLibraryType,
} from '../../shared/utils';
import { ReactLibGeneratorSchema } from './schema';

async function generateReactLib(
  tree: Tree,
  options: ReactLibGeneratorSchema,
  forMantine: boolean,
): Promise<GeneratorCallback | undefined> {
  const { AutoComplete } = require('enquirer');

  options.app = options.app || (await selectProject(tree, 'application', 'Select the application: ')).name;

  const isSharedLib = options.app === constants.sharedValue;

  options.scope =
    options.scope ||
    (isSharedLib ? '' : await askQuestion(`Enter the scope (e.g: profile) or '${constants.sharedValue}': `));
  options.type = options.type
    ? validateLibraryType(options.type)
    : await new AutoComplete({
        name: 'library type',
        message: 'Select the library type:',
        limit: Object.values(LibraryType).length,
        choices: Object.values(LibraryType),
      }).run();

  options.name = options.name || (await askQuestion('Enter the name of the library (e.g: settings): '));

  if (
    [LibraryType.FEATURES, LibraryType.UI].includes(options.type as LibraryType) &&
    !isBoolean(options.withComponent)
  ) {
    options.withComponent = await confirm('Generate component inside lib folder?');
  }

  const scopeTag = options.scope || constants.sharedValue;
  const tags = [`app:${options.app}`, `scope:${scopeTag}`, `type:${options.type}`];

  const libName = normalizeLibPath(`${options.app}/${options.scope}/${options.type}/${options.name}`);
  const libPath = `libs/${libName}`;

  if (forMantine) {
    const requireFromWorkspace = createRequire(path.join(tree.root, 'package.json'));
    const requireFromNext = createRequire(requireFromWorkspace.resolve('@nx/next/package.json'));
    const { libraryGenerator } = requireFromNext('@nx/react');

    await libraryGenerator(tree, {
      directory: libPath,
      name: libName,
      tags: tags.join(', '),
      skipPackageJson: true,
      unitTestRunner: 'none',
      component: false,
      linter: 'eslint',
      bundler: 'none',
      style: 'scss',
      addPlugin: true,
      skipFormat: true,
    });
  } else {
    const command = `npx nx g @nx/react:library --skipPackageJson --unitTestRunner=none --tags="${tags.join(', ')}" --name=${libName} ${libPath} --linter=eslint --component=false --bundler=none --style=scss`;

    execSync(options.dryRun ? `${command} --dry-run` : command, { stdio: 'inherit' });
  }

  if (options.dryRun) {
    return;
  }

  const substitutions = {
    ...options,
    libName,
    name: formatName(options.name, true),
  };

  generateFiles(tree, path.join(__dirname, 'files/base'), libPath, substitutions);

  if (options.withComponent) {
    generateFiles(tree, path.join(__dirname, 'files/component'), libPath, substitutions);
  }

  addNxScopeTag(tree, scopeTag);

  let install: GeneratorCallback | undefined;

  if (!forMantine && !isSharedLib && isNextApp(tree, `apps/${options.app}`)) {
    const project = getProjects(tree).get(libName);
    const workspace = createTestWorkspace(tree);

    scaffoldTestSuite(tree, workspace, { suite: 'unit', root: libPath, projectName: libName, project });
    install = workspace.apply();
  }

  await formatFiles(tree);

  return install && (() => runWithMinReleaseAgeDisabled(install));
}

export function reactLibGenerator(
  tree: Tree,
  options: ReactLibGeneratorSchema,
): Promise<GeneratorCallback | undefined> {
  return generateReactLib(tree, options, false);
}

export async function generateMantineUiKit(tree: Tree, directory: string): Promise<void> {
  await generateReactLib(
    tree,
    { app: directory, scope: 'shared', type: 'ui', name: 'ui-kit', withComponent: false },
    true,
  );
}

export default reactLibGenerator;
