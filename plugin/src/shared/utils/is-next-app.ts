import { Tree } from '@nx/devkit';

export const isNextApp = (tree: Tree, projectRoot: string): boolean => {
  return tree.exists(`${projectRoot}/next.config.js`);
};
