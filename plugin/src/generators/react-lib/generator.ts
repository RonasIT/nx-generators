import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { ReactLibGeneratorSchema } from './schema';
import { execSync } from 'child_process';
import { formatName } from '../../shared/utils';

export async function reactLibGenerator(
  tree: Tree,
  options: ReactLibGeneratorSchema
) {
  const libPath = options.directory
    ? `libs/${options.directory}`
    : `libs/${options.app}/${options.scope}/${options.type}/${options.name}`;
  const srcPath = `${libPath}/src`
  const command = `npx nx g @nx/expo:lib --skipPackageJson --unitTestRunner=none --projectNameAndRootFormat=derived ${libPath}`
  const commandWithOptions = options.dryRun ? command + ' --dry-run' : command

  execSync(commandWithOptions, { stdio: 'inherit' });

  if (options.withComponent) {
    generateFiles(tree, path.join(__dirname, 'files'), srcPath, { ...options, formatName });
    tree.write(`${srcPath}/index.ts`, "export * from './lib/component';");
  }

  await formatFiles(tree);
}

export default reactLibGenerator;
