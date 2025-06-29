/// <reference types="jest" />
import * as child_process from 'child_process';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { runFormUtilsGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn(),
  formatFiles: jest.fn(),
}));

const execSyncMock = child_process.execSync as jest.Mock;
const generateFilesMock = devkit.generateFiles as jest.Mock;
const formatFilesMock = devkit.formatFiles as jest.Mock;

describe('runFormUtilsGenerator', () => {
  let tree: devkit.Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Create dummy index.ts file that will be deleted
    tree.write('libs/myapp/shared/utils/form/src/index.ts', 'export {};');

    jest.clearAllMocks();
  });

  it('should run the form utils generator and update files correctly', async () => {
    const options = {
      directory: 'myapp',
    };

    await runFormUtilsGenerator(tree, options);

    // Check execSync called with correct nx command
    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=utils --name=form',
      { stdio: 'inherit' },
    );

    // Check the index.ts file was deleted
    expect(tree.exists('libs/myapp/shared/utils/form/src/index.ts')).toBe(false);

    // Check generateFiles called with correct parameters
    expect(generateFilesMock).toHaveBeenCalledWith(tree, path.join(__dirname, '/lib-files'), 'libs/myapp', {});

    // Check formatFiles called
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });
});
