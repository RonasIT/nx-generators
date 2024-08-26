import { Tree } from '@nx/devkit';

export const isExpoApp = (tree: Tree, projectRoot: string): boolean => {
  return tree.exists(`${projectRoot}/metro.config.js`);
};
