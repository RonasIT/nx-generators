import { execSync } from 'child_process';
import * as path from 'path';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  installPackagesTask,
  readJson,
  Tree,
  writeJson,
} from '@nx/devkit';
import { devDependencies } from '../../shared/dependencies';
import config from './config';
import { CodeChecksGeneratorSchema } from './schema';
import scripts from './scripts';

export async function codeChecksGenerator(tree: Tree, options: CodeChecksGeneratorSchema) {
  const projectRoot = '.';

  // Delete files
  tree.delete('.prettierrc');
  tree.delete('tsconfig.json');

  // Configure pre-commit hook
  execSync('npx mrm@2 lint-staged', { stdio: 'inherit' });

  // Install eslint plugin
  execSync('npx nx add @nx/eslint', { stdio: 'inherit' });

  const packageJson = readJson(tree, 'package.json');
  packageJson['lint-staged'] = config['lint-staged'];
  packageJson.scripts = { ...scripts, ...packageJson.scripts };
  writeJson(tree, 'package.json', packageJson);

  // Update tsconfig.base.json
  const tsconfigJson = readJson(tree, 'tsconfig.base.json');
  tsconfigJson.compilerOptions = { ...tsconfigJson.compilerOptions, ...config.tsconfig };
  tsconfigJson.exclude = [...config.tsConfigExclude];
  writeJson(tree, 'tsconfig.base.json', tsconfigJson);

  // Update .gitignore
  const gitignoreContent = tree.read('.gitignore')?.toString() + '\n' + config.gitIgnore.join('\n');
  tree.write('.gitignore', gitignoreContent);

  // Update .prettierignore
  const prettierignoreContent =
    tree.read('.prettierignore')?.toString() +
    '\n\n# Files with custom rules\n**/actions.ts\n**/epics.ts\n**/selectors.ts\n';
  tree.write('.prettierignore', prettierignoreContent);

  // Add files
  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);

  // Install necessary dependencies
  addDependenciesToPackageJson(tree, {}, devDependencies['code-checks']);

  await formatFiles(tree);

  return (): void => {
    installPackagesTask(tree);
  };
}

export default codeChecksGenerator;
