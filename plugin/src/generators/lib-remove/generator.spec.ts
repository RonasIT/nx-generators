/// <reference types="jest" />
import * as childProcess from 'child_process';
import { execSync } from 'child_process';
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

const asMock = <T extends (...args: Array<any>) => any>(fn: T): jest.MockedFunction<T> => fn as jest.MockedFunction<T>;
const libName = 'my-lib';

describe('libRemoveGenerator', () => {
  let tree: Tree;
  let execSyncMock: jest.MockedFunction<typeof execSync>;

  beforeEach(() => {
    tree = {} as Tree;
    execSyncMock = asMock(childProcess.execSync);
    jest.clearAllMocks();
  });

  it('removes a provided library name if user confirms', async () => {
    asMock(askQuestion).mockResolvedValue('y');

    await libRemoveGenerator(tree, { libName });

    expect(askQuestion).toHaveBeenCalledWith(`Are you sure you want to remove ${libName}? (y/n)`);
    expect(execSyncMock).toHaveBeenCalledWith(`npx nx g rm --project=${libName}`, { stdio: 'inherit' });
  });

  it('prompts for library name if not provided and removes after confirmation', async () => {
    asMock(selectProject as jest.Mock).mockResolvedValue({ name: libName });
    asMock(askQuestion).mockResolvedValue('yes');

    await libRemoveGenerator(tree, {});

    expect(selectProject).toHaveBeenCalledWith(tree, 'library', 'Select the library to remove: ');
    expect(execSyncMock).toHaveBeenCalledWith(`npx nx g rm --project=${libName}`, { stdio: 'inherit' });
  });

  it('does not remove library if user declines', async () => {
    asMock(selectProject as jest.Mock).mockResolvedValue({ name: libName });
    asMock(askQuestion).mockResolvedValue('n');

    await libRemoveGenerator(tree, {});

    expect(execSyncMock).not.toHaveBeenCalled();
  });

  it('throws an error if no library is selected or provided', async () => {
    asMock(selectProject as jest.Mock).mockResolvedValue({ name: '' });

    await expect(libRemoveGenerator(tree, {})).rejects.toThrow('No library found!');
  });
});
