import { readFileSync } from 'fs';
import * as path from 'path';
import {
  addDependenciesToPackageJson,
  installPackagesTask,
  readJson,
  removeDependenciesFromPackageJson,
  Tree,
  visitNotIgnoredFiles,
  writeJson,
} from '@nx/devkit';
import { devDependencies, eslintDependencies } from '../../shared/dependencies';
import { runNxAddCommand } from '../../shared/utils';
import config from './config';

const graphCommand = 'npx nx graph --file=.nx/project-graph.json';
const obsoleteConfig =
  /^(?:eslint\.config\.[cm]?[jt]s|\.eslintrc(?:\.[cm]?js|\.json|\.ya?ml)?|\.eslint\.ronasit\.cjs|\.prettierrc(?:\.[cm]?[jt]s|\.json|\.ya?ml|\.toml)?|prettier\.config\.[cm]?[jt]s)$/;

function removeEslintTargets(targets: Record<string, any> = {}): void {
  for (const [name, target] of Object.entries(targets)) {
    if (target.executor?.startsWith('@nx/eslint:')) {
      delete targets[name];
    }
  }
}

export function oxlintGenerator(tree: Tree): () => void {
  runNxAddCommand('@nx/oxlint');
  tree.delete('.oxlintrc.json');

  visitNotIgnoredFiles(tree, '.', (file) => {
    const basename = path.posix.basename(file);

    if (obsoleteConfig.test(basename)) {
      tree.delete(file);
    } else if (['package.json', 'project.json'].includes(basename)) {
      const config = readJson(tree, file);
      const original = JSON.stringify(config);
      delete config.eslintConfig;
      delete config.prettier;
      removeEslintTargets(config.targets);
      removeEslintTargets(config.nx?.targets);

      if (JSON.stringify(config) !== original) {
        writeJson(tree, file, config);
      }
    }
  });

  const updatedPackage = readJson(tree, 'package.json');
  updatedPackage.scripts = {
    ...updatedPackage.scripts,
    lint: `npx tsc && ${graphCommand} && npx oxlint .`,
    format: [
      'npx oxfmt --write .',
      'npm run lint -- --fix',
      ...(updatedPackage.scripts?.['lint:css'] ? ['npm run lint:css'] : []),
    ].join(' && '),
  };

  updatedPackage['lint-staged'] = config['lint-staged'];
  writeJson(tree, 'package.json', updatedPackage);

  const nxJson = readJson(tree, 'nx.json');
  nxJson.plugins = (nxJson.plugins ?? []).filter(
    (plugin: string | { plugin: string }) =>
      (typeof plugin === 'string' ? plugin : plugin.plugin) !== '@nx/eslint/plugin',
  );

  for (const plugin of nxJson.plugins) {
    if (typeof plugin !== 'string' && plugin.plugin === '@nx/oxlint') {
      plugin.options = { ...plugin.options, targetName: 'lint' };
    }
  }

  nxJson.targetDefaults ??= {};

  for (const name of Object.keys(nxJson.targetDefaults)) {
    if (name.startsWith('@nx/eslint:')) {
      delete nxJson.targetDefaults[name];
    }
  }

  nxJson.targetDefaults.lint = { cache: false };
  nxJson.targetDefaults['@nx/oxlint:lint'] = { cache: false };

  for (const generator of Object.values<Record<string, any>>(nxJson.generators ?? {})) {
    if (generator.linter === 'eslint') {
      generator.linter = 'none';
    }

    for (const defaults of Object.values<any>(generator)) {
      if (defaults?.linter === 'eslint') {
        defaults.linter = 'none';
      }
    }
  }

  writeJson(tree, 'nx.json', nxJson);

  if (!tree.exists('oxlint.config.ts')) {
    tree.write('oxlint.config.ts', readFileSync(path.join(__dirname, 'files/oxlint.config.ts.template'), 'utf-8'));
  }

  const formatterDefaults = JSON.parse(readFileSync(path.join(__dirname, 'files/.oxfmtrc.json.template'), 'utf-8'));
  const formatterConfig = tree.exists('.oxfmtrc.json') ? readJson(tree, '.oxfmtrc.json') : {};
  writeJson(tree, '.oxfmtrc.json', {
    ...formatterDefaults,
    ...formatterConfig,
    ignorePatterns: [...new Set([...(formatterConfig.ignorePatterns ?? []), ...formatterDefaults.ignorePatterns])],
  });
  tree.delete('.prettierignore');

  const gitignore = tree.read('.gitignore', 'utf-8') ?? '';

  if (!gitignore.split(/\r?\n/).includes('.nx/project-graph.json')) {
    tree.write('.gitignore', `${gitignore.trimEnd()}\n.nx/project-graph.json\n`);
  }

  const preCommit = tree.read('.husky/pre-commit', 'utf-8');

  if (preCommit?.includes('npx lint-staged') && !preCommit.includes(graphCommand)) {
    tree.write('.husky/pre-commit', preCommit.replace('npx lint-staged', `${graphCommand} && npx lint-staged`));
  }

  const dependenciesToRemove = [
    '@nx/eslint',
    '@nx/eslint-plugin',
    'prettier',
    ...Object.values(eslintDependencies).flatMap((dependencies) => Object.keys(dependencies)),
  ];
  removeDependenciesFromPackageJson(tree, dependenciesToRemove, dependenciesToRemove);
  addDependenciesToPackageJson(tree, {}, devDependencies.oxlint);

  return (): void => {
    installPackagesTask(tree);
  };
}

export default oxlintGenerator;
