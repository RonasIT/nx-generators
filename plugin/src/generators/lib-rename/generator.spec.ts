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

describe('libRenameGenerator', () => {
  const tree = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should rename using provided newLibName option without prompting', async () => {
    (utils.getLibraryDetailsByName as jest.Mock).mockResolvedValue({
      name: 'old-lib',
      path: 'libs/app/scope/type/old-lib',
    });
    (utils.askQuestion as jest.Mock).mockResolvedValue('should not be used');
    (utils.getImportPathPrefix as jest.Mock).mockReturnValue('libs');

    await libRenameGenerator(tree, { currentLibName: 'old-lib', newLibName: 'new-lib' });

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining(
        '--projectName=old-lib --newProjectName=app-scope-type-new-lib --destination=libs/app/scope/type/new-lib' +
          ' --importPath=libs/app/scope/type/new-lib',
      ),
      { stdio: 'inherit' },
    );
    expect(utils.askQuestion).not.toHaveBeenCalled();
  });

  it('should prompt for newLibName if not provided', async () => {
    (utils.getLibraryDetailsByName as jest.Mock).mockResolvedValue({
      name: 'old-lib',
      path: 'libs/app/scope/type/old-lib',
    });
    (utils.askQuestion as jest.Mock).mockResolvedValue('my-new-lib');
    (utils.getImportPathPrefix as jest.Mock).mockReturnValue('libs');

    await libRenameGenerator(tree, { currentLibName: 'old-lib' });

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining(
        '--projectName=old-lib --newProjectName=app-scope-type-my-new-lib --destination=libs/app/scope/type/my-new-lib --importPath=libs/app/scope/type/my-new-lib',
      ),
      { stdio: 'inherit' },
    );
    expect(utils.askQuestion).toHaveBeenCalledWith('Enter a new library name: ', 'old-lib');
  });
});
