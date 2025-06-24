/// <reference types="jest" />
import * as childProcess from 'child_process';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as utils from '../../shared/utils';
import { libMoveGenerator } from './generator';

jest.mock('child_process');
jest.mock('../../shared/utils', () => ({
  ...jest.requireActual('../../shared/utils'),
  getLibraryDetailsByName: jest.fn(),
  selectProject: jest.fn(),
  validateLibraryType: jest.fn((val) => val),
  getLibDirectoryName: jest.fn((name) => name),
  getImportPathPrefix: jest.fn(() => 'my-org'),
  askQuestion: jest.fn(),
}));

describe('libMoveGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.clearAllMocks();
  });

  it('should call nx mv with correct arguments', async () => {
    (utils.getLibraryDetailsByName as jest.Mock).mockResolvedValue({
      name: 'profile-shared-utils',
      path: 'libs/profile/shared/utils',
    });
    (utils.selectProject as jest.Mock).mockResolvedValue({
      name: 'mobile',
    });
    (utils.askQuestion as jest.Mock).mockResolvedValue('account');

    const execSyncMock = childProcess.execSync as jest.Mock;

    await libMoveGenerator(tree, {
      srcLibName: 'profile-shared-utils',
      type: 'ui',
    });

    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'npx nx g mv --projectName=profile-shared-utils --newProjectName=mobile-account-ui-utils --destination=libs/mobile/account/ui/utils --importPath=my-org/mobile/account/ui/utils',
      ),
      { stdio: 'inherit' },
    );
  });

  it('should run lib-tags after move', async () => {
    (utils.getLibraryDetailsByName as jest.Mock).mockResolvedValue({
      name: 'profile-shared-utils',
      path: 'libs/profile/shared/utils',
    });
    (utils.selectProject as jest.Mock).mockResolvedValue({
      name: 'mobile',
    });
    (utils.askQuestion as jest.Mock).mockResolvedValue('account');

    const execSyncMock = childProcess.execSync as jest.Mock;

    const callback = await libMoveGenerator(tree, {
      srcLibName: 'profile-shared-utils',
      type: 'ui',
    });

    callback();

    expect(execSyncMock).toHaveBeenCalledWith('npx nx g lib-tags --skipRepoCheck', { stdio: 'inherit' });
  });
});
