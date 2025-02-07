import { Tree } from '@nx/devkit';

export type AppFramework = 'expo' | 'next';

export const isNextApp = (tree: Tree, projectRoot: string): boolean => {
  return tree.exists(`${projectRoot}/next.config.js`);
};

export const isExpoApp = (tree: Tree, projectRoot: string): boolean => {
  return tree.exists(`${projectRoot}/metro.config.js`);
};

export const getAppFrameworkName = (tree: Tree, projectRoot: string): AppFramework | undefined => {
  return isNextApp(tree, projectRoot) ? 'next' : isExpoApp(tree, projectRoot) ? 'expo' : undefined;
};
