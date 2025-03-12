import { formatFiles, installPackagesTask, Tree } from '@nx/devkit';
import { getAppFrameworkName, selectProject } from '../../shared/utils';
import { SentryGeneratorSchema } from './schema';
import { generateSentryNext, generateSentryExpo } from './utils';

export async function sentryGenerator(tree: Tree, options: SentryGeneratorSchema): Promise<() => void> {
  options.directory =
    options.directory || (await selectProject(tree, 'application', 'Select the application: ', true)).path;

  const appFrameworkName = getAppFrameworkName(tree, options.directory);

  if (appFrameworkName === 'next') {
    generateSentryNext(tree, options, options.directory);
  } else if (appFrameworkName === 'expo') {
    generateSentryExpo(tree, options, options.directory);
  }

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
  };
}

export default sentryGenerator;
