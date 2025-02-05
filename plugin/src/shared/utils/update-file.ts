import { Tree } from '@nx/devkit';

export const updateFile = (tree: Tree, filePath: string, updater: (fileContent: string) => string) => {
  const fileContent = tree.read(filePath)?.toString();

  if (!fileContent) {
    return;
  }

  tree.write(filePath, updater(fileContent));
};
