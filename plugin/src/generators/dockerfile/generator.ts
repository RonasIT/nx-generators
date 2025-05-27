import * as path from 'path';
import { Tree, formatFiles, installPackagesTask, generateFiles, joinPathFragments } from '@nx/devkit';

export default async function (tree: Tree) {
  const projectRoot = `.`;
  const dockerfilePath = joinPathFragments(projectRoot, 'Dockerfile');

  if (tree.exists(dockerfilePath)) {
    tree.delete(dockerfilePath);
    console.log(`Removed existing Dockerfile`);
  }

  const templateSource = path.join(__dirname, 'files');

  generateFiles(tree, templateSource, projectRoot, {
    tmpl: '',
  });

  await formatFiles(tree);

  return (): void => {
    installPackagesTask(tree);
  };
}
