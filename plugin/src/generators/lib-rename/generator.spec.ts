/// <reference types="jest" />
import { execSync } from 'child_process';
import * as utils from '../../shared/utils';
import { libRenameGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('../../shared/utils', () => ({
  getLibraryDetailsByName: jest.fn(),
  askQuestion: jest.fn(),
  getImportPathPrefix: jest.fn(() => 'libs'),
}));

const asMock = <T extends (...args: Array<any>) => any>(fn: T): jest.MockedFunction<T> => fn as jest.MockedFunction<T>;

describe('libRenameGenerator', () => {
  let tree: any;
  let execSyncMock: jest.MockedFunction<typeof execSync>;

  const libraryDetails = {
    name: 'old-lib',
    path: 'libs/app/scope/type/old-lib',
  };

  const newLibName = 'new-lib';
  const newProjectName = 'app-scope-type-';
  const destination = 'libs/app/scope/type/';
  const importPath = 'libs/app/scope/type/';

  beforeEach(() => {
    tree = {} as any;
    execSyncMock = asMock(execSync);
    jest.clearAllMocks();

    asMock(utils.getImportPathPrefix).mockReturnValue('libs');
    asMock(utils.getLibraryDetailsByName).mockResolvedValue(libraryDetails);
  });

  it('renames using provided newLibName without prompting', async () => {
    asMock(utils.askQuestion).mockResolvedValue('should-not-be-used');

    await libRenameGenerator(tree, {
      currentLibName: libraryDetails.name,
      newLibName,
    });

    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(
        '--projectName=old-lib ' +
          `--newProjectName=${newProjectName}${newLibName} ` +
          `--destination=${destination}${newLibName} ` +
          `--importPath=${importPath}${newLibName}`,
      ),
      { stdio: 'inherit' },
    );
    expect(utils.askQuestion).not.toHaveBeenCalled();
  });

  it('prompts for newLibName if not provided', async () => {
    asMock(utils.askQuestion).mockResolvedValue(newLibName);

    await libRenameGenerator(tree, {
      currentLibName: libraryDetails.name,
    });

    expect(utils.askQuestion).toHaveBeenCalledWith('Enter a new library name: ', libraryDetails.name);
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
