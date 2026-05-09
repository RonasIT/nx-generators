/// <reference types="jest" />
import * as path from 'path';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { assertFirstLine, existsSyncMock } from '../../shared/tests-utils';
import * as sharedUtils from '../../shared/utils';
import { reactComponentGenerator } from './generator';

jest.mock('../../shared/utils', () => {
  const actual = jest.requireActual('../../shared/utils');

  return {
    ...actual,
    getNxLibsPaths: jest.fn(() => ['libs/shared/ui']),
  };
});

describe('reactComponentGenerator', () => {
  let tree: ReturnType<typeof createTreeWithEmptyWorkspace>;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.clearAllMocks();

    existsSyncMock.mockReturnValue(true);
    (sharedUtils.getNxLibsPaths as jest.Mock).mockImplementation(() => ['libs/shared/ui']);
  });

  it('should generate component files and update component index when subcomponent = true', async () => {
    const options = { name: 'MyComponent', subcomponent: true };
    const componentRoot = 'libs/shared/ui/lib/components/my-component';

    await reactComponentGenerator(tree, options);

    // Check generated files exist
    expect(tree.exists(`${componentRoot}/index.ts`)).toBe(true);

    // Assert first line correctness from templates with placeholders
    const templatesDir = path.join(__dirname, 'files');
    assertFirstLine(templatesDir, componentRoot, tree, {
      placeholders: { fileName: 'my-component' },
    });

    const componentsIndex = tree.read(`${componentRoot}/../index.ts`, 'utf-8');

    expect(componentsIndex).toContain("export * from './my-component'");
  });

  it('should generate component files without updating index when subcomponent is false', async () => {
    const options = { name: 'MainFeature', subcomponent: false };
    const libRoot = 'libs/shared/ui/lib';

    await reactComponentGenerator(tree, options);

    // Check expected files generated
    expect(tree.exists(`${libRoot}/component.tsx`)).toBe(true);
    expect(tree.exists(`${libRoot}/index.ts`)).toBe(true);

    // Assert first line correctness from templates with placeholders
    const templatesDir = path.join(__dirname, 'files');
    assertFirstLine(templatesDir, libRoot, tree, {
      placeholders: { fileName: 'main-feature' },
    });
  });
});
