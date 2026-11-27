/// <reference types="jest" />
import {
  getProjects,
  output,
  ProjectConfiguration,
  readCachedProjectGraph,
  readJson,
  Tree,
  writeJson,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { nextTestsGenerator } from './generator';

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  getProjects: jest.fn(() => new Map()),
  readCachedProjectGraph: jest.fn(),
  workspaceRoot: '/virtual',
}));

const appRoot = 'apps/web';
const e2eRoot = 'apps/web-e2e';
const uiRoot = 'libs/web/shared/ui/ui-kit';
const uiName = 'web/shared/ui/ui-kit';

describe('next-tests with stale project discovery', () => {
  let tree: Tree;

  function addMantineKit(): void {
    writeJson(tree, `${uiRoot}/project.json`, { name: uiName, projectType: 'library', targets: {} });
    tree.write(`${uiRoot}/tsconfig.lib.json`, '{}');
    tree.write(`${uiRoot}/src/lib/button/component.tsx`, '');
    tree.write(`${uiRoot}/src/lib/theme.tsx`, '');
    tree.write('libs/web/shared/ui/styles/global.scss', '');
  }

  function addApp(
    project: Partial<ProjectConfiguration> = { name: 'web', projectType: 'application', targets: {} },
  ): void {
    writeJson(tree, `${appRoot}/project.json`, project);
    tree.write(`${appRoot}/next.config.mjs`, 'export default {};');
    tree.write(`${appRoot}/tsconfig.json`, '{}');
  }

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    writeJson(tree, 'package.json', { devDependencies: { nx: '23.0.1' } });
    (getProjects as jest.Mock).mockImplementation(() => new Map());
    jest.mocked(readCachedProjectGraph).mockReturnValue({ nodes: {}, dependencies: {} });
    jest.spyOn(output, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('reads app, ui kit, and e2e projects from the tree when the project map is stale', async () => {
    addApp();
    addMantineKit();

    await nextTestsGenerator(tree, { directory: 'web' });

    const e2eConfig = tree.read(`${e2eRoot}/playwright.config.mts`, 'utf-8');

    expect(tree.read(`${appRoot}/vite.config.mts`, 'utf-8')).toContain('name: "web"');
    expect(tree.exists(`${appRoot}/tests/example.spec.tsx`)).toBe(true);
    expect(tree.exists(`${uiRoot}/tests/button.spec.tsx`)).toBe(true);
    expect(e2eConfig).toContain('apps/web-e2e/serve.mjs');
    expect(readJson(tree, `${e2eRoot}/project.json`).name).toBe('web-e2e');
    expect(readJson(tree, `${e2eRoot}/project.json`).implicitDependencies).toEqual(['web']);
    expect(readJson(tree, `${uiRoot}/project.json`).targets.test.cache).toBe(false);
    expect(readJson(tree, 'package.json').devDependencies).toMatchObject({
      '@nx/vitest': '23.0.1',
      '@nx/playwright': '23.0.1',
    });

    await nextTestsGenerator(tree, { directory: 'web' });

    expect(tree.read(`${e2eRoot}/playwright.config.mts`, 'utf-8')).toEqual(e2eConfig);
    expect(output.warn).not.toHaveBeenCalled();
  });

  it('keeps the Nx project name lookup when it is available', async () => {
    addApp();
    (getProjects as jest.Mock).mockImplementation(
      () =>
        new Map([
          ['customer-portal', { name: 'customer-portal', root: appRoot, projectType: 'application', targets: {} }],
        ]),
    );

    await nextTestsGenerator(tree, { directory: 'web' });

    expect(tree.read(`${appRoot}/vite.config.mts`, 'utf-8')).toContain('name: "customer-portal"');
  });

  it('checks inferred target collisions without writing inferred targets to project.json', async () => {
    addApp();
    addMantineKit();
    jest.mocked(readCachedProjectGraph).mockReturnValue({
      nodes: {
        web: { name: 'web', type: 'app', data: { root: appRoot, targets: { test: {}, e2e: {} } } },
        [uiName]: { name: uiName, type: 'lib', data: { root: uiRoot, targets: { build: {} } } },
      },
      dependencies: {},
    });

    await nextTestsGenerator(tree, { directory: 'web' });

    expect(tree.exists(`${appRoot}/vite.config.mts`)).toBe(false);
    expect(tree.exists(`${e2eRoot}/playwright.config.mts`)).toBe(false);
    expect(readJson(tree, `${uiRoot}/project.json`).targets).toEqual({ test: { cache: false } });
    expect(output.warn).toHaveBeenCalledWith({ title: expect.stringContaining('inferred Nx target web:test') });
    expect(output.warn).toHaveBeenCalledWith({ title: expect.stringContaining('target web:e2e') });
  });

  it('uses the package name when the local project file does not specify one', async () => {
    addApp({ projectType: 'application' });
    writeJson(tree, `${appRoot}/package.json`, { name: '@example/portal' });

    await nextTestsGenerator(tree, { directory: 'web' });

    expect(tree.read(`${appRoot}/vite.config.mts`, 'utf-8')).toContain('name: "@example/portal"');
    expect(readJson(tree, `${e2eRoot}/project.json`).implicitDependencies).toEqual(['@example/portal']);
  });

  it('reports a conflicting project at the e2e root found on disk', async () => {
    addApp();
    writeJson(tree, `${e2eRoot}/project.json`, { name: 'other-e2e', projectType: 'application', targets: {} });

    await nextTestsGenerator(tree, { directory: 'web' });

    expect(tree.exists(`${e2eRoot}/playwright.config.mts`)).toBe(false);
    expect(output.warn).toHaveBeenCalledWith({
      title: expect.stringContaining(`${e2eRoot} is already the root of Nx project "other-e2e"`),
    });
  });
});
