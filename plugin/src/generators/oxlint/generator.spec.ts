/// <reference types="jest" />
import { readJson, Tree, writeJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { devDependencies } from '../../shared/dependencies';
import { runNxAddCommand } from '../../shared/utils';
import config from './config';
import oxlintGenerator from './generator';

describe('oxlintGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    jest.mocked(runNxAddCommand).mockClear();
    tree = createTreeWithEmptyWorkspace();
    writeJson(tree, 'package.json', {
      scripts: {
        lint: 'npx tsc && npx eslint ./',
        'lint:css': 'npx stylelint "**/*.{css,scss}" --fix --allow-empty-input',
        format: 'npx prettier --write . && npm run lint -- --fix && npm run lint:css',
        build: 'nx build web',
      },
      devDependencies: {
        '@nx/eslint': '23.3.1',
        '@nx/eslint-plugin': '23.3.1',
        eslint: '^9.0.0',
        prettier: '^3.0.0',
      },
      'lint-staged': { '*.custom': 'custom-check' },
      eslintConfig: {},
      prettier: {},
    });
    writeJson(tree, 'nx.json', {
      plugins: [
        '@nx/eslint/plugin',
        { plugin: '@nx/next/plugin' },
        { plugin: '@nx/oxlint', options: { targetName: 'oxlint' } },
      ],
      targetDefaults: { '@nx/eslint:lint': { options: { lintFilePatterns: ['**/*.ts'] } }, build: { cache: true } },
      generators: { '@nx/react': { library: { linter: 'eslint' } } },
    });
    tree.write('.husky/pre-commit', 'npx lint-staged\n');
    tree.write('eslint.config.cjs', 'module.exports = [];');
    tree.write('.eslint.ronasit.cjs', 'module.exports = [];');
    tree.write('.prettierrc.js', 'module.exports = {};');
    tree.write('.oxlintrc.json', '{}');
    tree.write('apps/web/eslint.config.mjs', 'export default [];');
    writeJson(tree, 'apps/web/project.json', {
      name: 'web',
      targets: {
        lint: { executor: '@nx/eslint:lint', options: { lintFilePatterns: ['apps/web/**/*.ts'] } },
        build: { executor: '@nx/next:build' },
      },
    });
  });

  it('replaces the standard checks and removes ESLint and Prettier dependencies', () => {
    oxlintGenerator(tree);

    const pkg = readJson(tree, 'package.json');
    expect(runNxAddCommand).toHaveBeenCalledWith('@nx/oxlint');
    expect(pkg.devDependencies).toEqual(devDependencies.oxlint);
    expect(pkg.eslintConfig).toBeUndefined();
    expect(pkg.prettier).toBeUndefined();
    expect(pkg.scripts).toEqual({
      lint: 'npx tsc && npx nx graph --file=.nx/project-graph.json && npx oxlint .',
      'lint:css': 'npx stylelint "**/*.{css,scss}" --fix --allow-empty-input',
      format: 'npx oxfmt --write . && npm run lint -- --fix && npm run lint:css',
      build: 'nx build web',
    });
    expect(pkg['lint-staged']).toEqual(config['lint-staged']);
    expect(tree.read('.husky/pre-commit', 'utf-8')).toBe(
      'npx nx graph --file=.nx/project-graph.json && npx lint-staged\n',
    );

    for (const file of ['eslint.config.cjs', '.eslint.ronasit.cjs', '.prettierrc.js', 'apps/web/eslint.config.mjs']) {
      expect(tree.exists(file)).toBe(false);
    }

    expect(tree.exists('oxlint.config.ts')).toBe(true);
    expect(tree.exists('.oxlintrc.json')).toBe(false);
    expect(readJson(tree, '.oxfmtrc.json').$schema).toBe('./node_modules/oxfmt/configuration_schema.json');
  });

  it('also removes ESLint and Prettier packages from runtime dependencies without removing unrelated packages', () => {
    const pkg = readJson(tree, 'package.json');
    pkg.dependencies = {
      '@nx/eslint': '23.3.1',
      '@nx/eslint-plugin': '23.3.1',
      prettier: '^3.0.0',
      react: '^19.0.0',
    };
    writeJson(tree, 'package.json', pkg);

    oxlintGenerator(tree);

    expect(readJson(tree, 'package.json').dependencies).toEqual({ react: '^19.0.0' });
  });

  it('switches Nx to inferred Oxlint targets instead of translating ESLint options', () => {
    oxlintGenerator(tree);
    expect(readJson(tree, 'apps/web/project.json').targets).toEqual({
      build: { executor: '@nx/next:build' },
    });
    const nx = readJson(tree, 'nx.json');
    expect(nx.plugins).toEqual([
      { plugin: '@nx/next/plugin' },
      { plugin: '@nx/oxlint', options: { targetName: 'lint' } },
    ]);
    expect(nx.targetDefaults).toEqual({
      build: { cache: true },
      lint: { cache: false },
      '@nx/oxlint:lint': { cache: false },
    });
    expect(nx.generators['@nx/react'].library.linter).toBe('none');
  });

  it('preserves existing Ox configs on repeated runs', () => {
    tree.write('oxlint.config.ts', 'export default { rules: { "no-debugger": "error" } };\n');
    writeJson(tree, '.oxfmtrc.json', { singleQuote: true, ignorePatterns: ['custom-output'] });

    oxlintGenerator(tree);
    const changes = tree.listChanges();
    oxlintGenerator(tree);
    expect(tree.listChanges()).toEqual(changes);
    expect(tree.read('oxlint.config.ts', 'utf-8')).toContain('no-debugger');
    expect(readJson(tree, '.oxfmtrc.json')).toEqual(
      expect.objectContaining({
        singleQuote: true,
        ignorePatterns: expect.arrayContaining(['custom-output', '**/.nx/**']),
      }),
    );
  });
});
