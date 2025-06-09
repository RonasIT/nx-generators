/// <reference types="jest" />
import * as child_process from 'child_process';
import { Tree } from '@nx/devkit';
import * as utils from '../../shared/utils';
import { libMoveGenerator } from './generator';

jest.mock('child_process');
jest.mock('../../shared/utils');

const mockExecSync = jest.spyOn(child_process, 'execSync');
const mockGetLibraryDetailsByName = jest.spyOn(utils, 'getLibraryDetailsByName');
const mockSelectProject = jest.spyOn(utils, 'selectProject');
const mockAskQuestion = jest.spyOn(utils, 'askQuestion');
const mockValidateLibraryType = jest.spyOn(utils, 'validateLibraryType');
const mockGetLibDirectoryName = jest.spyOn(utils, 'getLibDirectoryName');
const mockGetImportPathPrefix = jest.spyOn(utils, 'getImportPathPrefix');

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn().mockImplementation(({ choices }) => ({
    run: jest.fn().mockResolvedValue(choices[0]), // return first choice from the prompt
  })),
}));

describe('libMoveGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = {} as Tree;
    jest.clearAllMocks();

    mockGetLibraryDetailsByName.mockResolvedValue({
      name: 'old-lib-name',
      path: 'libs/old-app/old-scope/old-type/old-lib-name',
    });

    mockSelectProject.mockImplementation(async () => {
      return { name: 'my-app', path: 'libs/my-app' };
    });

    mockAskQuestion.mockResolvedValueOnce('profile');
    mockAskQuestion.mockResolvedValueOnce('new-lib');
    mockValidateLibraryType.mockReturnValue('ui');
    mockGetLibDirectoryName.mockReturnValue('new-lib');
    mockGetImportPathPrefix.mockReturnValue('@my-org');
  });

  it('should move the library with renamed name and updated path', async () => {
    const result = await libMoveGenerator(tree, { srcLibName: 'old-lib-name' });

    expect(mockGetLibraryDetailsByName).toHaveBeenCalledWith(tree, 'old-lib-name');
    expect(mockSelectProject).toHaveBeenCalled();
    expect(mockAskQuestion).toHaveBeenCalledTimes(2);
    expect(mockValidateLibraryType).not.toHaveBeenCalled(); // because AutoComplete provides it
    expect(mockExecSync).toHaveBeenCalledWith(
      'npx nx g mv --projectName=old-lib-name --newProjectName=my-app-profile-ui-new-lib --destination=libs/my-app/profile/ui/new-lib --importPath=@my-org/my-app/profile/ui/new-lib',
      { stdio: 'inherit' },
    );

    result();
    expect(mockExecSync).toHaveBeenCalledWith('npx nx g lib-tags --skipRepoCheck', { stdio: 'inherit' });
  });

  it('should use sharedValue and skip asking for scope if app is shared', async () => {
    mockSelectProject.mockResolvedValue({ name: 'shared', path: 'libs/shared' });
    mockAskQuestion.mockResolvedValueOnce('new-lib');

    await libMoveGenerator(tree, { srcLibName: 'old-lib-name', type: 'util' });

    expect(mockAskQuestion).toHaveBeenCalledTimes(1); // only ask for new name
    expect(mockValidateLibraryType).toHaveBeenCalledWith('util');
  });

  it('should use provided options without prompting', async () => {
    await libMoveGenerator(tree, {
      srcLibName: 'old-lib-name',
      app: 'my-app',
      scope: 'dashboard',
      type: 'ui',
      name: 'new-lib',
    });

    expect(mockAskQuestion).not.toHaveBeenCalled();
    expect(mockValidateLibraryType).toHaveBeenCalledWith('ui');
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('--newProjectName=my-app-dashboard-ui-new-lib'),
      expect.anything(),
    );
  });
});
