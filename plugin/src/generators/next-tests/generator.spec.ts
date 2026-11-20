/// <reference types="jest" />
import { addProjectConfiguration, getProjects, output, readJson, Tree, writeJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { nextTestsGenerator } from './generator';

const appRoot = 'apps/web';
const e2eRoot = 'apps/web-e2e';
const uiRoot = 'libs/web/shared/ui/ui-kit';
const appName = 'customer-portal';
const uiName = 'web/shared/ui/ui-kit';

describe('next-tests', () => {
  let tree: Tree;

  function addMantineKit(): void {
    addProjectConfiguration(tree, uiName, { root: uiRoot, projectType: 'library', targets: {} });
    tree.write(`${uiRoot}/tsconfig.lib.json`, '{}');
    tree.write(`${uiRoot}/src/lib/button/component.tsx`, '');
    tree.write(`${uiRoot}/src/lib/theme.tsx`, '');
    tree.write('libs/web/shared/ui/styles/global.scss', '');
  }

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    writeJson(tree, 'package.json', { devDependencies: { nx: '23.0.1' } });
    addProjectConfiguration(tree, appName, { root: appRoot, projectType: 'application', targets: {} });
    tree.write(`${appRoot}/next.config.mjs`, 'export default {};');
    tree.write(`${appRoot}/tsconfig.json`, '{}');
    jest.spyOn(output, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('resolves the actual Nx project and creates all three setups without baselines', async () => {
    addMantineKit();

    await nextTestsGenerator(tree, { directory: 'web' });

    const projects = getProjects(tree);

    expect(tree.read(`${appRoot}/vite.config.mts`, 'utf-8')).toContain(`name: "${appName}"`);
    expect(tree.exists(`${appRoot}/tests/example.spec.tsx`)).toBe(true);
    expect(tree.exists(`${uiRoot}/tests/button.spec.tsx`)).toBe(true);
    expect(tree.exists(`${e2eRoot}/tests/home.spec.ts`)).toBe(true);
    expect(tree.read(`${e2eRoot}/serve.mjs`, 'utf-8')).toContain(`const appName = "${appName}"`);
    expect(projects.get('web-e2e')?.implicitDependencies).toEqual([appName]);
    expect(projects.get('web-e2e')?.targets?.e2e?.cache).toBe(false);
    expect(projects.get(uiName)?.targets?.test?.cache).toBe(false);
    expect(readJson(tree, 'package.json').devDependencies).toMatchObject({
      '@nx/vitest': '23.0.1',
      '@nx/playwright': '23.0.1',
      '@vitest/browser-playwright': '4.1.12',
      vitest: '4.1.12',
    });
    expect(readJson(tree, 'nx.json').plugins).toContainEqual({
      plugin: '@nx/playwright/plugin',
      options: { ciTargetName: '' },
    });
    expect(tree.listChanges().some(({ path }) => path.endsWith('.png'))).toBe(false);
    expect(tree.exists('eslint.config.cjs')).toBe(false);
    expect(output.warn).not.toHaveBeenCalled();
  });

  it('skips browser testing for a non-Mantine app and does not retrofit libraries', async () => {
    addProjectConfiguration(tree, uiName, { root: uiRoot, projectType: 'library' });
    tree.write(`${uiRoot}/src/index.ts`, '');

    await nextTestsGenerator(tree, { directory: 'web' });

    expect(tree.exists(`${uiRoot}/vite.config.mts`)).toBe(false);
    expect(readJson(tree, 'package.json').devDependencies['@vitest/browser-playwright']).toBeUndefined();
  });

  it('preserves custom configs and tests byte-for-byte, and only fills unaffected setups', async () => {
    addMantineKit();
    const log = jest.spyOn(output, 'log').mockImplementation(() => undefined);
    const protectedFiles = {
      [`${appRoot}/vitest.config.cts`]: 'module.exports = {test:{environment:"node"}};\r\n',
      [`${appRoot}/tests/custom.test.ts`]: 'export const custom= 1;\r\n',
      [`${e2eRoot}/playwright.config.cjs`]: 'module.exports={ testDir: "specs" };\r\n',
      'vite.config.cjs': 'module.exports = {};\r\n',
    };

    for (const [path, content] of Object.entries(protectedFiles)) {
      tree.write(path, content);
    }

    await nextTestsGenerator(tree, { directory: 'web' });
    await nextTestsGenerator(tree, { directory: 'web' });

    for (const [path, content] of Object.entries(protectedFiles)) {
      expect(tree.read(path)).toEqual(Buffer.from(content));
    }

    expect(tree.exists(`${uiRoot}/tests/button.spec.tsx`)).toBe(true);
    expect(tree.exists(`${appRoot}/vite.config.mts`)).toBe(false);
    expect(tree.exists('vitest.config.mts')).toBe(false);
    expect(tree.exists(`${e2eRoot}/project.json`)).toBe(false);
    expect(output.warn).toHaveBeenCalledWith({ title: expect.stringContaining(`${appRoot}/vitest.config.cts`) });
    expect(output.warn).toHaveBeenCalledWith({ title: expect.stringContaining(e2eRoot) });
    expect(log).toHaveBeenCalledWith({
      title: expect.stringContaining('Keeping the existing root test runner config'),
      bodyLines: ['vite.config.cjs'],
    });
  });

  it('keeps plugin options and ESLint config intact, and repairs a missing generated setup on rerun', async () => {
    addMantineKit();
    const log = jest.spyOn(output, 'log').mockImplementation(() => undefined);
    const plugins = [
      { plugin: '@nx/vitest', include: ['apps/**', 'libs/**'], options: { testTargetName: 'unit-test' } },
      { plugin: '@nx/playwright/plugin', options: { targetName: 'browser-e2e', ciTargetName: 'existing-ci' } },
    ];
    const eslint = "module.exports = [{ rules: { 'react-native/no-raw-text': 'error' } }];\n";

    writeJson(tree, 'nx.json', { plugins });
    tree.write('eslint.config.cjs', eslint);

    await nextTestsGenerator(tree, { directory: 'web' });
    const configPath = `${appRoot}/vite.config.mts`;
    const setupPath = `${appRoot}/tests/setup.ts`;
    const config = tree.read(configPath);
    const setup = tree.read(setupPath);
    const customTest = `${appRoot}/tests/example.spec.tsx`;
    const customContent = '// Scaffolded by @ronas-it/nx-generators:next-tests (unit)\nexport const custom = 1;\n';

    expect(setup).not.toBeNull();
    tree.write(customTest, customContent);
    tree.delete(setupPath);
    log.mockClear();

    const install = await nextTestsGenerator(tree, { directory: 'web' });
    const keptFiles = log.mock.calls.flatMap(([entry]) => entry.bodyLines ?? []);

    expect(install).toBeUndefined();
    expect(tree.read(configPath)).toEqual(config);
    expect(tree.read(customTest, 'utf-8')).toBe(customContent);
    expect(tree.read(setupPath)).toEqual(setup);
    expect(keptFiles).toEqual(expect.arrayContaining([customTest, configPath]));
    expect(keptFiles).not.toContain(setupPath);
    expect(readJson(tree, 'nx.json').plugins).toEqual(plugins);
    expect(getProjects(tree).get('web-e2e')?.targets).toEqual({ 'browser-e2e': { cache: false } });
    expect(getProjects(tree).get(uiName)?.targets?.['unit-test']?.cache).toBe(false);
    expect(tree.read('eslint.config.cjs', 'utf-8')).toBe(eslint);
    expect(output.warn).not.toHaveBeenCalled();
  });

  it('does not replace incompatible dependencies or prevent independent E2E setup', async () => {
    writeJson(tree, 'package.json', { devDependencies: { nx: '23.0.1', vitest: '^5.0.0' } });

    await nextTestsGenerator(tree, { directory: 'web' });

    expect(readJson(tree, 'package.json').devDependencies.vitest).toBe('^5.0.0');
    expect(tree.exists(`${appRoot}/vite.config.mts`)).toBe(false);
    expect(tree.exists(`${e2eRoot}/playwright.config.mts`)).toBe(true);
    expect(output.warn).toHaveBeenCalledWith({ title: expect.stringContaining('vitest@^5.0.0') });
  });

  it.each([undefined, '^4.1.0'])(
    'matches Nx plugins and the browser provider to installed versions (Vitest declaration: %s)',
    async (vitest) => {
      addMantineKit();
      writeJson(tree, 'package.json', { devDependencies: { nx: '^23.0.0', vitest } });
      writeJson(tree, 'node_modules/nx/package.json', { version: '23.0.2' });
      writeJson(tree, 'node_modules/vitest/package.json', { version: '4.1.13' });

      await nextTestsGenerator(tree, { directory: 'web' });

      expect(readJson(tree, 'package.json').devDependencies).toMatchObject({
        '@nx/vitest': '23.0.2',
        '@nx/playwright': '23.0.2',
        '@vitest/browser-playwright': '4.1.13',
        vitest: vitest ?? '4.1.13',
      });
      expect(tree.exists(`${uiRoot}/vite.config.mts`)).toBe(true);
      expect(output.warn).not.toHaveBeenCalled();
    },
  );

  it('does not generate a browser suite around an incompatible locally installed provider', async () => {
    addMantineKit();
    writeJson(tree, `${uiRoot}/package.json`, { devDependencies: { '@vitest/browser-playwright': '^4.1.0' } });
    writeJson(tree, `${uiRoot}/node_modules/@vitest/browser-playwright/package.json`, { version: '4.1.8' });

    await nextTestsGenerator(tree, { directory: 'web' });

    expect(tree.exists(`${appRoot}/vite.config.mts`)).toBe(true);
    expect(tree.exists(`${uiRoot}/vite.config.mts`)).toBe(false);
    expect(tree.exists(`${e2eRoot}/playwright.config.mts`)).toBe(true);
    expect(readJson(tree, 'package.json').devDependencies['@vitest/browser-playwright']).toBeUndefined();
    expect(output.warn).toHaveBeenCalledWith({ title: expect.stringContaining('resolved 4.1.8') });
  });

  it('does not create a competing suite when it finds tests without a runner config', async () => {
    const custom = `${appRoot}/app/component.test.tsx`;

    tree.write(custom, 'export const custom= 1;\r\n');
    await nextTestsGenerator(tree, { directory: 'web' });

    expect(tree.read(custom)).toEqual(Buffer.from('export const custom= 1;\r\n'));
    expect(tree.exists(`${appRoot}/vite.config.mts`)).toBe(false);
    expect(tree.exists(`${e2eRoot}/playwright.config.mts`)).toBe(true);
    expect(output.warn).toHaveBeenCalledWith({ title: expect.stringContaining(custom) });
  });

  it('scaffolds a missing unit config around compatible Vitest tests without duplicating them', async () => {
    const fixtures = {
      [`${appRoot}/tests/example.spec.tsx`]: `import { expect, it } from 'vitest';\r\n\r\nit('runs', () => {\r\n  expect(true).toBe(true);\r\n});\r\n`,
      [`${appRoot}/tests/location.spec.ts`]: `import { expect, it } from 'vitest';\n\nit('locates', () => {\n  expect(true).toBe(true);\n});\n`,
    };

    for (const [path, content] of Object.entries(fixtures)) {
      tree.write(path, content);
    }

    await nextTestsGenerator(tree, { directory: 'web' });

    for (const [path, content] of Object.entries(fixtures)) {
      expect(tree.read(path)).toEqual(Buffer.from(content));
    }

    expect(tree.read(`${appRoot}/vite.config.mts`, 'utf-8')).toContain(`name: "${appName}"`);
    expect(tree.exists(`${appRoot}/tests/setup.ts`)).toBe(true);
    expect(
      tree
        .children(`${appRoot}/tests`)
        .filter((name) => /\.(?:test|spec)\.tsx?$/.test(name))
        .sort(),
    ).toEqual(['example.spec.tsx', 'location.spec.ts']);
    expect(output.warn).not.toHaveBeenCalled();
  });

  it('still skips tests under tests/ that are incompatible with the generated unit setup', async () => {
    const custom = `${appRoot}/tests/example.spec.tsx`;
    const content = `import { expect, it } from '@jest/globals';\r\n`;

    tree.write(custom, content);

    await nextTestsGenerator(tree, { directory: 'web' });

    expect(tree.read(custom)).toEqual(Buffer.from(content));
    expect(tree.exists(`${appRoot}/vite.config.mts`)).toBe(false);
    expect(output.warn).toHaveBeenCalledWith({ title: expect.stringContaining(custom) });
  });

  it('reports occupied Nx target and project names', async () => {
    writeJson(tree, `${appRoot}/package.json`, { scripts: { test: 'node custom-test.js' } });
    addProjectConfiguration(tree, 'web-e2e', { root: 'apps/other' });

    await nextTestsGenerator(tree, { directory: 'web' });

    expect(output.warn).toHaveBeenCalledWith({ title: expect.stringContaining('already defines the "test" script') });
    expect(output.warn).toHaveBeenCalledWith({ title: expect.stringContaining('name is already used at apps/other') });
    expect(tree.exists(`${appRoot}/vite.config.mts`)).toBe(false);
    expect(tree.exists(`${e2eRoot}/playwright.config.mts`)).toBe(false);
  });

  it.each([appRoot, e2eRoot])('keeps the legacy Cypress config at %s without adding Playwright', async (root) => {
    const cypress = `${root}/cypress.json`;
    tree.write(cypress, '{}\n');

    await nextTestsGenerator(tree, { directory: 'web' });

    expect(tree.read(cypress, 'utf-8')).toBe('{}\n');
    expect(tree.exists(`${e2eRoot}/playwright.config.mts`)).toBe(false);
    expect(tree.exists(`${appRoot}/vite.config.mts`)).toBe(true);
    expect(output.warn).toHaveBeenCalledWith({ title: expect.stringContaining(cypress) });
  });

  it('rejects missing and non-Next projects', async () => {
    addProjectConfiguration(tree, 'mobile', { root: 'apps/mobile', projectType: 'application' });

    await expect(nextTestsGenerator(tree, { directory: 'missing' })).rejects.toThrow('No Nx project');
    await expect(nextTestsGenerator(tree, { directory: 'mobile' })).rejects.toThrow('not a Next.js application');
  });
});
