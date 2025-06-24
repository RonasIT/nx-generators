/// <reference types="jest" />
import * as childProcess from 'child_process';
import { Tree } from '@nx/devkit';
import { askQuestion, selectProject } from '../../shared/utils';
import { libRemoveGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('../../shared/utils', () => ({
  askQuestion: jest.fn(),
  selectProject: jest.fn(),
}));

describe('libRemoveGenerator', () => {
  const tree = {} as Tree;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove a library by name if provided and confirmed', async () => {
    (askQuestion as jest.Mock).mockResolvedValue('y');

    await libRemoveGenerator(tree, { libName: 'my-lib' });

    expect(askQuestion).toHaveBeenCalledWith('Are you sure you want to remove my-lib? (y/n)');
    expect(childProcess.execSync).toHaveBeenCalledWith('npx nx g rm --project=my-lib', { stdio: 'inherit' });
  });

  it('should prompt for library name if not provided', async () => {
    (selectProject as jest.Mock).mockResolvedValue({ name: 'auto-lib' });
    (askQuestion as jest.Mock).mockResolvedValue('yes');

    await libRemoveGenerator(tree, {});

    expect(selectProject).toHaveBeenCalledWith(tree, 'library', 'Select the library to remove: ');
    expect(childProcess.execSync).toHaveBeenCalledWith('npx nx g rm --project=auto-lib', { stdio: 'inherit' });
  });

  it('should not remove library if user says no', async () => {
    (selectProject as jest.Mock).mockResolvedValue({ name: 'auto-lib' });
    (askQuestion as jest.Mock).mockResolvedValue('n');

    await libRemoveGenerator(tree, {});

    expect(childProcess.execSync).not.toHaveBeenCalled();
  });

  it('should throw if no library is selected or provided', async () => {
    (selectProject as jest.Mock).mockResolvedValue({ name: '' });

    await expect(libRemoveGenerator(tree, {})).rejects.toThrow('No library found!');
  });
});
