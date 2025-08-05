/// <reference types="jest" />
import * as path from 'path';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { assertFirstLine, existsSyncMock } from '../../shared/tests-utils';
import { reactComponentGenerator } from './generator';

describe('reactComponentGenerator', () => {
  let tree: ReturnType<typeof createTreeWithEmptyWorkspace>;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.clearAllMocks();

    existsSyncMock.mockReturnValue(true);
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
