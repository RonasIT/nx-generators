import { execSync } from 'child_process';
import { installPackagesTask, Tree } from '@nx/devkit';
import { NextAppGeneratorSchema } from './schema';
import { existsSync } from 'fs';

export async function nextAppGenerator(
  tree: Tree,
  options: NextAppGeneratorSchema
) {
  const appRoot = `apps/${options.directory}`;

  // Install @nx/next plugin
  execSync('npx nx add @nx/next', { stdio: 'inherit' });

  if (!existsSync(appRoot)) {
    execSync(
      `npx nx g @nx/next:app ${options.name} --directory=apps/${options.directory} --projectNameAndRootFormat=as-provided --style=scss --src=false --unitTestRunner=none --e2eTestRunner=none`
    );
  }

  // Remove unnecessary files and files that will be replaced
  tree.delete(`${appRoot}/public/.gitkeep`);

  return () => {
    installPackagesTask(tree);
  };
}

export default nextAppGenerator;
