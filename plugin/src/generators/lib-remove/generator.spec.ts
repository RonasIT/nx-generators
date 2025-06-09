/// <reference types="jest" />
import * as child_process from 'child_process';
import { Tree } from '@nx/devkit';
import * as utils from '../../shared/utils';
import { libRemoveGenerator } from './generator';

jest.mock('child_process');
jest.mock('../../shared/utils');

const mockExecSync = jest.spyOn(child_process, 'execSync');
const mockAskQuestion = jest.spyOn(utils, 'askQuestion');
const mockSelectProject = jest.spyOn(utils, 'selectProject');

describe('libRemoveGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = {} as Tree;
    jest.clearAllMocks();
  });

  it('should remove the specified library if user confirms', async () => {
    mockAskQuestion.mockResolvedValue('yes');

    await libRemoveGenerator(tree, {
      libName: 'test-lib',
    });

    expect(mockAskQuestion).toHaveBeenCalledWith('Are you sure you want to remove test-lib? (y/n)');
    expect(mockExecSync).toHaveBeenCalledWith('npx nx g rm --project=test-lib', { stdio: 'inherit' });
  });

  it('should prompt to select a library if libName is not provided', async () => {
    mockSelectProject.mockResolvedValue({ name: 'selected-lib', path: 'libs/selected-lib' });
    mockAskQuestion.mockResolvedValue('yes');

    await libRemoveGenerator(tree, {});

    expect(mockSelectProject).toHaveBeenCalledWith(tree, 'library', 'Select the library to remove: ');
    expect(mockAskQuestion).toHaveBeenCalledWith('Are you sure you want to remove selected-lib? (y/n)');
    expect(mockExecSync).toHaveBeenCalledWith('npx nx g rm --project=selected-lib', { stdio: 'inherit' });
  });

  it('should not remove the library if user does not confirm', async () => {
    mockSelectProject.mockResolvedValue({ name: 'test-lib', path: 'libs/test-lib' });
    mockAskQuestion.mockResolvedValue('no');

    await libRemoveGenerator(tree, {});

    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it('should throw if no library is selected or provided', async () => {
    mockSelectProject.mockResolvedValue({ name: '', path: '' });

    await expect(libRemoveGenerator(tree, {})).rejects.toThrow('No library found!');
  });
});
