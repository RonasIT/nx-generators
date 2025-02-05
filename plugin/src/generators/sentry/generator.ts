import { formatFiles, Tree } from '@nx/devkit';
import { isExpoApp, isNextApp, selectProject } from '../../shared/utils';
import { SentryGeneratorSchema } from './schema';
import { generateSentryNext, generateSentryExpo } from './utils';

export async function sentryGenerator(tree: Tree, options: SentryGeneratorSchema) {
  options.directory =
    options.directory || (await selectProject(tree, 'application', 'Select the application: ', true)).path;

  console.log('options.directory', options.directory);

  if (isNextApp(tree, options.directory)) {
    generateSentryNext(tree, options, options.directory);
  } else if (isExpoApp(tree, options.directory)) {
    generateSentryExpo(tree, options, options.directory);
  }

  await formatFiles(tree);
}

export default sentryGenerator;
