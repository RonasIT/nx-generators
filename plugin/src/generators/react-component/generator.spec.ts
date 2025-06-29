/// <reference types="jest" />
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { reactComponentGenerator } from './generator';

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn().mockImplementation(() => ({
    run: jest.fn().mockResolvedValue('libs/shared/ui'),
  })),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn(),
  formatFiles: jest.fn(),
}));

jest.mock('../../shared/utils', () => ({
  formatName: jest.fn((name: string, capitalize: boolean) =>
    capitalize ? name.charAt(0).toUpperCase() + name.slice(1) : name,
  ),
  getNxLibsPaths: jest.fn(() => ['libs/shared/ui']),
  appendFileContent: jest.fn(),
  LibraryType: {
    FEATURES: 'features',
    UI: 'ui',
  },
}));

const filesPathMatcher = expect.stringMatching(/react-component[/\\]files$/);

describe('reactComponentGenerator', () => {
  const generateFilesMock = devkit.generateFiles as jest.Mock;
  const formatFilesMock = devkit.formatFiles as jest.Mock;
  const appendFileContentMock = require('../../shared/utils').appendFileContent as jest.Mock;

  let tree: ReturnType<typeof createTreeWithEmptyWorkspace>;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.clearAllMocks();
  });

  it('should generate component files and update component index when subcomponent = true', async () => {
    const options = { name: 'MyComponent', subcomponent: true };

    await reactComponentGenerator(tree, options);

    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      filesPathMatcher,
      'libs/shared/ui/lib/components/my-component',
      expect.objectContaining({ name: 'MyComponent' }),
    );

    expect(appendFileContentMock).toHaveBeenCalledWith(
      'libs/shared/ui/index.ts',
      expect.stringContaining(`export * from './lib';`),
      tree,
    );

    expect(appendFileContentMock).toHaveBeenCalledWith(
      'libs/shared/ui/lib/index.ts',
      expect.stringContaining(`export * from './components';`),
      tree,
    );

    expect(tree.exists('libs/shared/ui/lib/components/index.ts')).toBe(true);
    const contents = tree.read('libs/shared/ui/lib/components/index.ts', 'utf-8');
    expect(contents).toContain(`export * from './my-component';`);

    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });

  it('should only generate files and call formatFiles when subcomponent = false', async () => {
    const options = { name: 'MainFeature', subcomponent: false };

    await reactComponentGenerator(tree, options);

    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      filesPathMatcher,
      'libs/shared/ui/lib',
      expect.objectContaining({ name: 'MainFeature' }),
    );

    expect(appendFileContentMock).not.toHaveBeenCalled();
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });
});
