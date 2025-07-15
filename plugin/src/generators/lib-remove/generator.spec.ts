/// <reference types="jest" />
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { askQuestion, execSyncMock, selectProject } from '../../shared/utils';
import { libRemoveGenerator } from './generator';

jest.mock('../../shared/utils', () => {
  const actual = jest.requireActual('../../shared/utils');

  return {
    ...actual,
    askQuestion: jest.fn(),
    selectProject: jest.fn(),
  };
});

const asMock = <T extends (...args: Array<any>) => any>(fn: T): jest.MockedFunction<T> => fn as jest.MockedFunction<T>;

const libName = 'my-lib';
const libPath = `libs/${libName}`;

describe('libRemoveGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace();

    // Add a dummy library project to the workspace
    tree.write(
      'workspace.json',
      JSON.stringify(
        {
          version: 2,
          projects: {
            [libName]: {
              root: `libs/${libName}`,
              sourceRoot: `libs/${libName}/src`,
              projectType: 'library',
              targets: {},
            },
          },
        },
        null,
        2,
      ),
    );
  });

  it('should remove a provided library name if user confirms', async () => {
    asMock(askQuestion).mockResolvedValue('y');

    await libRemoveGenerator(tree, { libName });

    expect(askQuestion).toHaveBeenCalledWith(`Are you sure you want to remove ${libName}? (y/n)`);
    expect(execSyncMock).toHaveBeenCalledWith(`npx nx g rm --project=${libName}`, { stdio: 'inherit' });
  });

  it('should prompt for library name if not provided and removes after confirmation', async () => {
    asMock(selectProject).mockResolvedValue({ name: libName, path: libPath });
    asMock(askQuestion).mockResolvedValue('yes');

    await libRemoveGenerator(tree, {});

    expect(selectProject).toHaveBeenCalledWith(tree, 'library', 'Select the library to remove: ');
    expect(execSyncMock).toHaveBeenCalledWith(`npx nx g rm --project=${libName}`, { stdio: 'inherit' });
  });

  it('should not remove library if user declines', async () => {
    asMock(selectProject).mockResolvedValue({ name: libName, path: libPath });
    asMock(askQuestion).mockResolvedValue('n');

    await libRemoveGenerator(tree, {});

    expect(execSyncMock).not.toHaveBeenCalled();
  });

  it('should throw an error if no library is selected or provided', async () => {
    asMock(selectProject).mockResolvedValue({ name: '', path: libPath });

    await expect(libRemoveGenerator(tree, {})).rejects.toThrow('No library found!');
  });
});
