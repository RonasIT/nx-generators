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
import config from './config';
import { CodeChecksGeneratorSchema } from './schema';
import scripts from './scripts';

export async function codeChecksGenerator(tree: Tree, options: CodeChecksGeneratorSchema) {
  const projectRoot = '.';

  // Delete files
  tree.delete('.eslintrc.json');
  tree.delete('.prettierrc');

  // Configure pre-commit hook
  execSync('npx mrm@2 lint-staged', { stdio: 'inherit' });

  const packageJson = readJson(tree, 'package.json');
  packageJson['lint-staged'] = config['lint-staged'];
  packageJson.scripts = { ...scripts, ...packageJson.scripts };
  writeJson(tree, 'package.json', packageJson);

  // Update tsconfig.base.json
  const tsconfigJson = readJson(tree, 'tsconfig.base.json');
  tsconfigJson.compilerOptions = { ...config.tsconfig, ...tsconfigJson.compilerOptions };
  writeJson(tree, 'tsconfig.base.json', tsconfigJson);

  // Update .gitignore
  const gitignoreContent = tree.read('.gitignore')?.toString() + '\n.eslintcache\n';
  tree.write('.gitignore', gitignoreContent);

  // Add files
  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);

  // Install necessary dependencies
  addDependenciesToPackageJson(
    tree,
    {},
    {
      'eslint': '^8.48.0',
      'prettier': '^2.6.2',
      'eslint-config-prettier': '^9.0.0',
      'eslint-import-resolver-typescript': '^3.6.1',
      'eslint-plugin-import': '^2.27.5',
      'eslint-plugin-jsx-a11y': '^6.7.1',
      'eslint-plugin-react': '^7.32.2',
      'eslint-plugin-react-hooks': '^4.6.0',
      'eslint-plugin-react-native': '^4.1.0',
      'eslint-plugin-unused-imports': '^3.0.0',
      '@typescript-eslint/eslint-plugin': '^6.13.2',
      '@typescript-eslint/parser': '^6.13.2',
      'tsc-files': '^1.1.4',
    }
  );

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
  };
}

export default codeChecksGenerator;
