import { Tree } from '@nx/devkit';
import { BaseGeneratorType } from '../../enums';
import { NavigationUtilsGeneratorSchema } from './schema';
import { setupLib } from './utils';

export async function runNavigationUtilsGenerator(tree: Tree, options: NavigationUtilsGeneratorSchema): Promise<void> {
  const { appDirectory, baseGeneratorType } = options;

  setupLib(tree, appDirectory, 'navigation');

  if (baseGeneratorType === BaseGeneratorType.NEXT_APP) {
    setupLib(tree, appDirectory, 'filtering-search-params');
  }
}

export default runNavigationUtilsGenerator;
