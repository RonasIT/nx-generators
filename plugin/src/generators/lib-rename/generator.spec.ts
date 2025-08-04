/// <reference types="jest" />
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import {
  execSyncMock,
  getLibraryDetailsByNameMock,
  askQuestionMock,
  getImportPathPrefixMock,
} from '../../shared/tests-utils';
import { libRenameGenerator } from './generator';

jest.mock('../../shared/utils/cli-utils', () => ({
  getLibraryDetailsByName: jest.fn(),
  askQuestion: jest.fn(),
  getImportPathPrefix: jest.fn(() => 'libs'),
}));

const asMock = <T extends (...args: Array<any>) => any>(fn: T): jest.MockedFunction<T> => fn as jest.MockedFunction<T>;

describe('libRenameGenerator', () => {
  let tree: Tree;

  const libraryDetails = {
    name: 'old-lib',
    path: 'libs/app/scope/type/old-lib',
  };

  const newLibName = 'new-lib';
  const newProjectName = 'app-scope-type-';
  const destination = 'libs/app/scope/type/';
  const importPath = 'libs/app/scope/type/';

  beforeEach(() => {
    jest.clearAllMocks();

    tree = createTreeWithEmptyWorkspace();

    // Add dummy library project to workspace
    tree.write(
      'workspace.json',
      JSON.stringify(
        {
          version: 2,
          projects: {
            [libraryDetails.name]: {
              root: libraryDetails.path,
              sourceRoot: `${libraryDetails.path}/src`,
              projectType: 'library',
              targets: {},
            },
          },
        },
        null,
        2,
      ),
    );

    asMock(getImportPathPrefixMock).mockReturnValue('libs');
    asMock(getLibraryDetailsByNameMock).mockResolvedValue(libraryDetails);
  });

  it('should rename using provided newLibName without prompting', async () => {
    asMock(askQuestionMock).mockResolvedValue('should-not-be-used');

    await libRenameGenerator(tree, {
      currentLibName: libraryDetails.name,
      newLibName,
    });

    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(
        `--projectName=${libraryDetails.name} ` +
          `--newProjectName=${newProjectName}${newLibName} ` +
          `--destination=${destination}${newLibName} ` +
          `--importPath=${importPath}${newLibName}`,
      ),
      { stdio: 'inherit' },
    );
    expect(askQuestionMock).not.toHaveBeenCalled();
  });

  it('should prompt for newLibName if not provided', async () => {
    asMock(askQuestionMock).mockResolvedValue(newLibName);

    await libRenameGenerator(tree, {
      currentLibName: libraryDetails.name,
    });

    expect(askQuestionMock).toHaveBeenCalledWith('Enter a new library name: ', libraryDetails.name);
    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(
        `--projectName=${libraryDetails.name} ` +
          `--newProjectName=${newProjectName}${newLibName} ` +
          `--destination=${destination}${newLibName} ` +
          `--importPath=${importPath}${newLibName}`,
      ),
      { stdio: 'inherit' },
    );
  });
});
