/// <reference types="jest" />
import * as child_process from 'child_process';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { runI18nNextGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => {
  const original = jest.requireActual('@nx/devkit');

  return {
    ...original,
    generateFiles: jest.fn(),
    formatFiles: jest.fn(),
  };
});

const execSyncMock = child_process.execSync as jest.Mock;
const generateFilesMock = devkit.generateFiles as jest.Mock;
const formatFilesMock = devkit.formatFiles as jest.Mock;

describe('runI18nNextGenerator', () => {
  let tree: devkit.Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Create dummy index.ts file that should be deleted
    tree.write('libs/myapp/shared/utils/i18n/src/index.ts', 'export {};');

    jest.clearAllMocks();
  });

  it('should run the i18n-next generator and update files correctly', async () => {
    const options = {
      directory: 'myapp',
      name: 'myapp',
    };

    await runI18nNextGenerator(tree, options);

    // Check execSync called with correct nx generate command
    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=utils --name=i18n --withComponent=false',
      { stdio: 'inherit' },
    );

    // Check that the index.ts file was deleted
    expect(tree.exists('libs/myapp/shared/utils/i18n/src/index.ts')).toBe(false);

    // Check generateFiles called with correct parameters
    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      path.join(__dirname, 'lib-files'),
      'libs/myapp',
      expect.objectContaining({
        ...options,
        formatName: expect.any(Function),
        formatAppIdentifier: expect.any(Function),
        libPath: expect.stringContaining('myapp'),
      }),
    );

    // Check formatFiles called
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });
});
