/// <reference types="jest" />
import { addProjectConfiguration, output, Tree, writeJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { nextTestsGenerator } from './generator';

const appRoot = 'apps/web';
const e2eRoot = 'apps/web-e2e';
const uiRoot = 'libs/web/shared/ui/ui-kit';
const appName = 'customer-portal';
const uiName = 'web/shared/ui/ui-kit';

const generatedFiles = [
  `${appRoot}/vite.config.mts`,
  `${appRoot}/tsconfig.spec.json`,
  `${appRoot}/tests/setup.ts`,
  `${appRoot}/tests/example.spec.tsx`,
  `${uiRoot}/vite.config.mts`,
  `${uiRoot}/tsconfig.spec.json`,
  `${uiRoot}/tests/setup.ts`,
  `${uiRoot}/tests/global.scss`,
  `${uiRoot}/tests/expect-screenshot.ts`,
  `${uiRoot}/tests/button.spec.tsx`,
  `${e2eRoot}/playwright.config.mts`,
  `${e2eRoot}/serve.mjs`,
  `${e2eRoot}/tests/home.spec.ts`,
  'vitest.config.mts',
];

describe('next-tests no-change rerun', () => {
  let tree: Tree;
  let log: jest.SpyInstance;

  function keptFiles(): Array<string> {
    return log.mock.calls.flatMap(([entry]) => entry.bodyLines ?? []);
  }

  function keepTitles(): Array<string> {
    return log.mock.calls.map(([entry]) => entry.title);
  }

  function snapshotChanges(): ReturnType<Tree['listChanges']> {
    return tree.listChanges().map((change) => ({ ...change, content: change.content && Buffer.from(change.content) }));
  }

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
    log = jest.spyOn(output, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('lists every generated file it keeps on a no-change rerun without writing anything', async () => {
    addMantineKit();
    await nextTestsGenerator(tree, { directory: 'web' });

    const changes = snapshotChanges();
    log.mockClear();

    await nextTestsGenerator(tree, { directory: 'web' });

    const titles = keepTitles();

    expect(titles).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`Keeping existing unit test files in ${appRoot}`),
        expect.stringContaining(`Keeping existing browser test files in ${uiRoot}`),
        expect.stringContaining(`Keeping existing e2e test files in ${e2eRoot}`),
        expect.stringContaining('Keeping the existing root test runner config'),
      ]),
    );
    expect(keptFiles()).toEqual(expect.arrayContaining(generatedFiles));
    expect(snapshotChanges()).toEqual(changes);
  });

  it('reports preserved compatible specs without the scaffold header and skips screenshot baselines', async () => {
    const example = `${appRoot}/tests/example.spec.tsx`;
    const custom = `${appRoot}/tests/custom.test.ts`;
    const baseline = `${appRoot}/tests/__screenshots__/example.png`;
    const exampleContent = "import { describe } from 'vitest';\n\ndescribe('custom', () => {});\n";
    const customContent = "import { it } from 'vitest';\n\nit('works', () => {});\n";
    const baselineContent = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

    tree.write(example, exampleContent);
    tree.write(custom, customContent);

    await nextTestsGenerator(tree, { directory: 'web' });

    tree.write(baseline, baselineContent);
    log.mockClear();

    await nextTestsGenerator(tree, { directory: 'web' });

    expect(tree.exists(`${appRoot}/vite.config.mts`)).toBe(true);
    expect(keptFiles()).toEqual(expect.arrayContaining([example, custom]));
    expect(keptFiles()).not.toContain(baseline);
    expect(tree.read(example, 'utf-8')).toBe(exampleContent);
    expect(tree.read(custom, 'utf-8')).toBe(customContent);
    expect(tree.read(baseline)).toEqual(baselineContent);
  });
});
