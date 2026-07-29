import { addDependenciesToPackageJson, formatFiles, installPackagesTask, Tree, output } from '@nx/devkit';
import { dependencies } from '../../shared/dependencies';
import { getAppFrameworkName } from '../../shared/utils';
import { NuqsGeneratorSchema } from './schema';
import { addNuqsAdapterToProviders, hasNuqsAdapter, wrapLayoutBodyWithNuqsAdapter } from './utils';

export async function runNuqsGenerator(tree: Tree, options: NuqsGeneratorSchema): Promise<() => void> {
  const appRoot = `apps/${options.directory}`;

  if (getAppFrameworkName(tree, appRoot) !== 'next') {
    throw new Error(
      `The nuqs generator can only be used in a Next.js application, but "${options.directory}" is not one.`,
    );
  }

  addDependenciesToPackageJson(tree, dependencies['nuqs'], {});

  const providersPath = `${appRoot}/app/[locale]/providers.tsx`;

  if (tree.exists(providersPath)) {
    const providersContent = tree.read(providersPath, 'utf-8') as string;

    if (hasNuqsAdapter(providersContent)) {
      output.log({ title: `NuqsAdapter is already set up in ${providersPath}.` });
    } else {
      tree.write(providersPath, addNuqsAdapterToProviders(providersContent));
    }
  } else {
    const layoutPath = `${appRoot}/app/[locale]/layout.tsx`;

    if (!tree.exists(layoutPath)) {
      throw new Error(`Could not find ${layoutPath} to wire up the NuqsAdapter.`);
    }

    const layoutContent = tree.read(layoutPath, 'utf-8') as string;

    if (hasNuqsAdapter(layoutContent)) {
      output.log({ title: `NuqsAdapter is already set up in ${layoutPath}.` });
    } else {
      tree.write(layoutPath, wrapLayoutBodyWithNuqsAdapter(layoutContent));
    }
  }

  await formatFiles(tree);

  return (): void => {
    installPackagesTask(tree);
  };
}

export default runNuqsGenerator;
