import { execSync } from 'child_process';
import * as path from 'path';
import {
  addDependenciesToPackageJson,
  formatFiles,
  installPackagesTask,
  Tree,
  output,
  generateFiles,
  readJson,
  writeJson,
} from '@nx/devkit';
import { dependencies, devDependencies } from '../../shared/dependencies';
import { getAppFrameworkName, getImportPathPrefix } from '../../shared/utils';
import { MantineGeneratorSchema } from './schema';
import { addMantineProvider, hasMantineProvider, wrapLayoutBodyWithMantine } from './utils';
import { configureMantine } from './utils/configure-mantine';

export async function runMantineGenerator(tree: Tree, options: MantineGeneratorSchema): Promise<() => void> {
  const appRoot = `apps/${options.directory}`;
  const repoRoot = '.';

  if (getAppFrameworkName(tree, appRoot) !== 'next') {
    throw new Error(
      `The Mantine generator can only be used in a Next.js application, but "${options.directory}" is not one.`,
    );
  }

  addDependenciesToPackageJson(tree, dependencies['mantine'], devDependencies['mantine']);

  const providersPath = `${appRoot}/app/[locale]/providers.tsx`;
  const layoutPath = `${appRoot}/app/[locale]/layout.tsx`;
  const importPathPrefix = getImportPathPrefix(tree);
  const stylesLibPath = `${importPathPrefix}/${options.directory}/shared/ui/styles`;
  const uiKitLibrarySpecifier = `${importPathPrefix}/${options.directory}/shared/ui/ui-kit`;

  if (tree.exists(providersPath)) {
    const providersContent = tree.read(providersPath, 'utf-8') as string;

    if (hasMantineProvider(providersContent)) {
      output.log({ title: `MantineProvider is already set up in ${providersPath}.` });
    } else {
      tree.write(providersPath, addMantineProvider(providersContent, uiKitLibrarySpecifier));
    }
  } else {
    if (!tree.exists(layoutPath)) {
      throw new Error(`Could not find ${layoutPath} to wire up the MantineProvider.`);
    }

    const layoutContent = tree.read(layoutPath, 'utf-8') as string;

    if (hasMantineProvider(layoutContent)) {
      output.log({ title: `MantineProvider is already set up in ${layoutPath}.` });
    } else {
      tree.write(layoutPath, wrapLayoutBodyWithMantine(layoutContent, uiKitLibrarySpecifier));
    }
  }

  const layoutContent = tree.read(layoutPath, 'utf-8') as string;

  tree.write(layoutPath, configureMantine(layoutContent, `${stylesLibPath}/global`));

  generateFiles(tree, path.join(__dirname, 'files/root'), repoRoot, {});
  generateFiles(tree, path.join(__dirname, 'files/styles'), `libs/${options.directory}/shared/ui/styles`, {});

  execSync(
    `npx nx g react-lib --app=${options.directory} --scope=shared --type=ui --name=ui-kit --withComponent=false`,
    {
      stdio: 'inherit',
    },
  );
  generateFiles(tree, path.join(__dirname, 'files/ui-kit'), `libs/${options.directory}/shared/ui/ui-kit/src`, {});

  // Read tsconfig.base.json only after react-lib's execSync has finished writing its own
  // path entry to disk, so this write doesn't stage a stale snapshot that clobbers it on flush.
  const tsConfig = readJson(tree, 'tsconfig.base.json');
  const paths = tsConfig.compilerOptions.paths;

  paths[`${stylesLibPath}/variables`] = [`libs/${options.directory}/shared/ui/styles/_variables.scss`];
  paths[`${stylesLibPath}/global`] = [`libs/${options.directory}/shared/ui/styles/global.scss`];

  writeJson(tree, 'tsconfig.base.json', tsConfig);

  await formatFiles(tree);

  return (): void => {
    installPackagesTask(tree);
  };
}

export default runMantineGenerator;
