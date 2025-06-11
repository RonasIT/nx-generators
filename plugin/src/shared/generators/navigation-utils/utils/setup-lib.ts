import { execSync } from 'child_process';
import * as path from 'path';
import { generateFiles, Tree } from '@nx/devkit';

export function setupLib(tree: Tree, appDirectory: string, libName: string): void {
  execSync(`npx nx g react-lib --app=${appDirectory} --scope=shared --type=utils --name=${libName}`, {
    stdio: 'inherit',
  });

  const libRoot = `libs/${appDirectory}`;
  const libPath = `${libRoot}/shared/utils/${libName}/src`;
  tree.delete(`${libPath}/index.ts`);

  generateFiles(tree, path.join(__dirname, `../${libName}-lib-files`), libRoot, {});
}
