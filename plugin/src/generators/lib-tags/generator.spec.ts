/// <reference types="jest" />
import * as child_process from 'child_process';
import { Tree, getProjects } from '@nx/devkit';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as utils from '../../shared/utils';
import { libTagsGenerator } from './generator';
import * as checkUtils from './utils';

jest.mock('child_process');
jest.mock('../../shared/utils');
jest.mock('@nx/devkit');
jest.mock('./utils');

const mockConfirm = utils.confirm as jest.Mock;
const mockVerifyESLintConstraintsConfig = utils.verifyESLintConstraintsConfig as jest.Mock;
const mockCheckApplicationTags = checkUtils.checkApplicationTags as jest.Mock;
const mockCheckLibraryTags = checkUtils.checkLibraryTags as jest.Mock;
const mockExecSync = child_process.execSync as jest.Mock;
const mockFormatFiles = devkit.formatFiles as jest.Mock;

describe('libTagsGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.clearAllMocks();

    (getProjects as jest.Mock).mockReturnValue(
      new Map([
        ['app1', { name: 'app1', projectType: 'application', root: 'apps/app1' }],
        ['lib1', { name: 'lib1', projectType: 'library', root: 'libs/lib1' }],
      ]),
    );
  });

  it('should skip repo check if skipRepoCheck is true', async () => {
    mockExecSync.mockReturnValue('M somefile.txt');
    const options = { skipRepoCheck: true, silent: true };

    await libTagsGenerator(tree, options);

    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it('should exit early if user does not confirm when unstaged changes are present', async () => {
    mockExecSync.mockReturnValue('M somefile.txt');
    mockConfirm.mockResolvedValue(false);

    const options = { skipRepoCheck: false, silent: true };

    await libTagsGenerator(tree, options);

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockVerifyESLintConstraintsConfig).not.toHaveBeenCalled();
    expect(mockCheckApplicationTags).not.toHaveBeenCalled();
    expect(mockFormatFiles).not.toHaveBeenCalled();
  });

  it('should verify eslint config, check tags, and format files', async () => {
    mockExecSync.mockReturnValue('');
    mockVerifyESLintConstraintsConfig.mockImplementation(undefined);
    mockCheckApplicationTags.mockImplementation(undefined);
    mockCheckLibraryTags.mockImplementation(undefined);

    const options = { skipRepoCheck: false, silent: false };

    await libTagsGenerator(tree, options);

    expect(mockVerifyESLintConstraintsConfig).toHaveBeenCalledWith(tree);
    expect(mockCheckApplicationTags).toHaveBeenCalled();
    expect(mockCheckLibraryTags).toHaveBeenCalled();
    expect(mockFormatFiles).toHaveBeenCalledWith(tree);
  });

  it('should silence log output if silent is true', async () => {
    mockExecSync.mockReturnValue('');
    const options = { skipRepoCheck: true, silent: true };

    await libTagsGenerator(tree, options);

    // context.log is overwritten internally — this test ensures no throw and completes
    expect(mockFormatFiles).toHaveBeenCalled();
  });
});
