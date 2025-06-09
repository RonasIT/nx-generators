/// <reference types="jest" />
import * as fs from 'fs';
import { Tree, generateFiles, formatFiles } from '@nx/devkit';
import * as utils from '../../shared/utils';
import { reactComponentGenerator } from './generator';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn(),
  formatFiles: jest.fn(),
}));

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn().mockImplementation(() => ({
    run: jest.fn().mockResolvedValue('libs/my-app/profile/ui/settings'),
  })),
}));

jest.mock('../../shared/utils', () => ({
  ...jest.requireActual('../../shared/utils'),
  appendFileContent: jest.fn(),
  formatName: jest.fn((name) => name),
  getNxLibsPaths: jest.fn(() => ['libs/my-app/profile/ui/settings']),
}));

describe('reactComponentGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = {
      write: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  it('should generate component and update all indexes if subcomponent is true and none exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false); // All files "don't exist"

    await reactComponentGenerator(tree, {
      name: 'ExampleComponent',
      subcomponent: true,
    });

    expect(generateFiles).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('/files'),
      'libs/my-app/profile/ui/settings/lib/components/example-component',
      expect.objectContaining({ name: 'ExampleComponent' }),
    );

    // Should create 3 appendFileContent calls
    expect(utils.appendFileContent).toHaveBeenCalledWith(
      'libs/my-app/profile/ui/settings/index.ts',
      expect.stringContaining(`export * from './lib';`),
      tree,
    );

    expect(utils.appendFileContent).toHaveBeenCalledWith(
      'libs/my-app/profile/ui/settings/lib/index.ts',
      expect.stringContaining(`export * from './components';`),
      tree,
    );

    // Since components index doesn't exist, it should call write()
    expect(tree.write).toHaveBeenCalledWith(
      'libs/my-app/profile/ui/settings/lib/components/index.ts',
      `export * from './example-component';\n`,
    );

    expect(formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should not update indexes if subcomponent is false', async () => {
    await reactComponentGenerator(tree, {
      name: 'SimpleComponent',
      subcomponent: false,
    });

    expect(utils.appendFileContent).not.toHaveBeenCalled();
    expect(tree.write).not.toHaveBeenCalledWith(expect.stringContaining('components/index.ts'), expect.any(String));
  });

  it('should append to components index if it already exists', async () => {
    // Simulate that components index exists
    (fs.existsSync as jest.Mock).mockImplementation((filePath) => filePath.endsWith('components/index.ts'));

    await reactComponentGenerator(tree, {
      name: 'AppendComponent',
      subcomponent: true,
    });

    expect(utils.appendFileContent).toHaveBeenCalledWith(
      'libs/my-app/profile/ui/settings/lib/components/index.ts',
      `export * from './append-component';\n`,
      tree,
    );
  });
});
