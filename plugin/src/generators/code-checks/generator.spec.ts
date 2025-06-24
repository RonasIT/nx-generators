/// <reference types="jest" />
import { Tree, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
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
    expect(tree.exists('eslint.config.cjs')).toBe(false);

    // Updated package.json
    const pkg = readJson(tree, 'package.json');
    expect(pkg.scripts.lint).toBeDefined();
    expect(pkg['lint-staged']).toBeDefined();

    // Updated tsconfig.base.json
    const tsconfig = readJson(tree, 'tsconfig.base.json');
    expect(tsconfig.compilerOptions.noFallthroughCasesInSwitch).toBe(true);

    // .gitignore should include .eslintcache
    const gitignore = tree.read('.gitignore')?.toString();
    expect(gitignore).toContain('.eslintcache');

    // .prettierignore should include comment and ignored files
    const prettierignore = tree.read('.prettierignore')?.toString();
    expect(prettierignore).toContain('**/actions.ts');
    expect(prettierignore).toContain('**/epics.ts');
    expect(prettierignore).toContain('**/selectors.ts');

    // New config files
    expect(tree.exists('.eslint.ronasit.cjs')).toBe(true);
    expect(tree.exists('.prettierrc.js')).toBe(true);
    expect(tree.exists('eslint.config.cjs')).toBe(true);
    expect(tree.exists('eslint.constraints.json')).toBe(true);
    expect(tree.exists('tsconfig.json')).toBe(true);
    expect(tree.exists('types.d.ts')).toBe(true);

    // Callback should be a function
    expect(typeof installFn).toBe('function');
  });
});
