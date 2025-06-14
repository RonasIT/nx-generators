/// <reference types="jest" />
import * as child_process from 'child_process';
import { Tree } from '@nx/devkit';
import * as utils from '../../shared/utils';
import { libRenameGenerator } from './generator';

jest.mock('child_process');
jest.mock('../../shared/utils');

const mockExecSync = jest.spyOn(child_process, 'execSync');
const mockGetLibraryDetailsByName = jest.spyOn(utils, 'getLibraryDetailsByName');
const mockAskQuestion = jest.spyOn(utils, 'askQuestion');
const mockGetImportPathPrefix = jest.spyOn(utils, 'getImportPathPrefix');

describe('libRenameGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = {} as Tree;

    mockExecSync.mockClear();
    mockGetLibraryDetailsByName.mockReset();
    mockAskQuestion.mockReset();
    mockGetImportPathPrefix.mockReset();
  });

  it('should rename a library with given newLibName', async () => {
    mockGetLibraryDetailsByName.mockResolvedValue({
      name: 'old-lib-name',
      path: 'libs/app/scope/type/old-lib-name',
    });
    mockGetImportPathPrefix.mockReturnValue('@my-org');

    await libRenameGenerator(tree, {
      currentLibName: 'old-lib-name',
      newLibName: 'new-lib-name',
    });

    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining(
        'npx nx g mv --projectName=old-lib-name --newProjectName=app-scope-type-new-lib-name --destination=libs/app/scope/type/new-lib-name --importPath=@my-org/app/scope/type/new-lib-name',
      ),
      { stdio: 'inherit' },
    );
  });

  it('should prompt for new library name if not provided', async () => {
    mockGetLibraryDetailsByName.mockResolvedValue({
      name: 'old-lib-name',
      path: 'libs/app/scope/type/old-lib-name',
    });
    mockAskQuestion.mockResolvedValue('renamed-lib');
    mockGetImportPathPrefix.mockReturnValue('@my-org');

    await libRenameGenerator(tree, {
      currentLibName: 'old-lib-name',
    });

    expect(mockAskQuestion).toHaveBeenCalledWith('Enter a new library name: ', 'old-lib-name');

    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining(
        'npx nx g mv --projectName=old-lib-name --newProjectName=app-scope-type-renamed-lib --destination=libs/app/scope/type/renamed-lib --importPath=@my-org/app/scope/type/renamed-lib',
      ),
      { stdio: 'inherit' },
    );
  });
});
