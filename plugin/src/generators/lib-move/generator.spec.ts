/// <reference types="jest" />
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as utils from '../../shared/utils';
import { libMoveGenerator } from './generator';

jest.mock('../../shared/utils', () => ({
  ...jest.requireActual('../../shared/utils'),
  getLibraryDetailsByName: jest.fn(),
  selectProject: jest.fn(),
  askQuestion: jest.fn(),
}));

describe('libMoveGenerator', () => {
  let tree: Tree;
  let execSyncMock: jest.Mock;

  const libraryDetails = {
    name: 'profile-shared-utils',
    path: 'libs/profile/shared/utils',
  };
  const selectedProject = { name: 'mobile' };
  const answer = 'account';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.clearAllMocks();

    (utils.getLibraryDetailsByName as jest.Mock).mockResolvedValue(libraryDetails);
    (utils.selectProject as jest.Mock).mockResolvedValue(selectedProject);
    (utils.askQuestion as jest.Mock).mockResolvedValue(answer);

    execSyncMock = jest.spyOn(require('child_process'), 'execSync').mockImplementation(() => ({})) as jest.Mock;
  });

  const runGenerator = async (): Promise<() => void> =>
    libMoveGenerator(tree, { srcLibName: libraryDetails.name, type: 'ui' });

  it('should call nx mv with correct args', async () => {
    await runGenerator();

    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(
        [
          'npx nx g mv',
          `--projectName=${libraryDetails.name}`,
          '--newProjectName=mobile-account-ui-account',
          '--destination=libs/mobile/account/ui/account',
          '--importPath=@proj/mobile/account/ui/account',
        ].join(' '),
      ),
      { stdio: 'inherit' },
    );
  });

  it('should run lib-tags after move', async () => {
    const postMoveCallback = await runGenerator();

    postMoveCallback();

    expect(execSyncMock).toHaveBeenCalledWith('npx nx g lib-tags --skipRepoCheck', { stdio: 'inherit' });
  });
});
