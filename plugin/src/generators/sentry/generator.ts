import { formatFiles, Tree } from '@nx/devkit';
import { SentryGeneratorSchema } from './schema';
import { isExpoApp, isNextApp } from '../../shared/utils';
import { generateSentryNext, generateSentryExpo } from './utils';

export async function sentryGenerator(
  tree: Tree,
  options: SentryGeneratorSchema,
) {
  const projectRoot = `apps/${options.directory}`;

  if (isNextApp(tree, projectRoot)) {
    generateSentryNext(tree, options, projectRoot);
  } else if (isExpoApp(tree, projectRoot)) {
    generateSentryExpo(tree, options, projectRoot);
  }

  await formatFiles(tree);
}

export default sentryGenerator;
