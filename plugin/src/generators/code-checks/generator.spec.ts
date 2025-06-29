/// <reference types="jest" />
import { Tree, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import config from './config';
import codeChecksGenerator from './generator';
import { CodeChecksGeneratorSchema } from './schema';

describe('codeChecksGenerator (integration)', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Seed necessary files
    tree.write('package.json', JSON.stringify({ scripts: { build: 'echo "build"' } }, null, 2));
    tree.write('tsconfig.base.json', JSON.stringify({ compilerOptions: { target: 'esnext' } }, null, 2));
    tree.write('.gitignore', 'node_modules\n');
    tree.write('.prettierignore', 'dist\n');

    // Files to be deleted
    tree.write('.eslintrc.json', '{}');
    tree.write('.prettierrc', '{}');
    tree.write('eslint.config.cjs', '');
  });

  it('should modify and generate files as expected', async () => {
    const options: CodeChecksGeneratorSchema = { name: 'my-app' };
    const installFn = await codeChecksGenerator(tree, options);

    // Deleted legacy config files
    expect(tree.exists('.eslintrc.json')).toBe(false);
    expect(tree.exists('.prettierrc')).toBe(false);

    // Re-created file
    expect(tree.exists('eslint.config.cjs')).toBe(true);

    // Verify contents of eslint.config.cjs
    const eslintConfig = tree.read('eslint.config.cjs', 'utf-8');
    expect(eslintConfig).toContain('module.exports'); // or match actual known content

    // Updated package.json
    const pkg = readJson(tree, 'package.json');
    expect(pkg.scripts.lint).toContain('eslint');
    expect(pkg['lint-staged']).toEqual(expect.objectContaining(config['lint-staged']));

    // Updated tsconfig.base.json
    const tsconfig = readJson(tree, 'tsconfig.base.json');
    expect(tsconfig.compilerOptions.allowSyntheticDefaultImports).toBe(true);

    // .gitignore should include .eslintcache
    const gitignore = tree.read('.gitignore', 'utf-8');
    expect(gitignore).toContain('.eslintcache');

    // .prettierignore should include comment and ignored files
    const prettierignore = tree.read('.prettierignore', 'utf-8');
    expect(prettierignore).toContain('# Files with custom rules');
    expect(prettierignore).toContain('**/actions.ts');
    expect(prettierignore).toContain('**/epics.ts');
    expect(prettierignore).toContain('**/selectors.ts');

    // Assert contents of other new files
    const eslintRonasit = tree.read('.eslint.ronasit.cjs', 'utf-8');
    expect(eslintRonasit).toContain('module.exports');

    const prettierrc = tree.read('.prettierrc.js', 'utf-8');
    expect(prettierrc).toContain('module.exports');

    const constraints = tree.read('eslint.constraints.json', 'utf-8');
    expect(JSON.parse(constraints as string)).toEqual(expect.any(Object));

    const tsconfigJson = tree.read('tsconfig.json', 'utf-8');
    expect(tsconfigJson).toContain('"extends": "./tsconfig.base.json"');

    const types = tree.read('types.d.ts', 'utf-8');
    expect(types).toContain('// This file is added for correct work of TS-checks in pre-commit hook using tsc-files');

    // Callback should be a function
    expect(typeof installFn).toBe('function');
  });
});
