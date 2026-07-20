/// <reference types="jest" />
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { assertFirstLine, execSyncMock, generateFilesMock } from '../../tests-utils';
import * as utils from '../../utils';
import { runNavigationUtilsGenerator } from './generator';

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  appendFileContent: jest.fn(),
}));

const appendFileContentMock = utils.appendFileContent as jest.Mock;

describe('runNavigationUtilsGenerator', () => {
  let tree: devkit.Tree;
  const libsPath = 'libs/myapp';
  const navigationLibFiles = 'navigation-lib-files';
  const indexFilePath = 'libs/myapp/shared/utils/navigation/src/index.ts';
  const appDirectory = 'myapp';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Create dummy index.ts file that should be deleted
    tree.write(indexFilePath, 'export {};');

    jest.clearAllMocks();
  });

  it('should run react-lib generation and generate common files', async () => {
    await runNavigationUtilsGenerator(tree, { appDirectory });

    expect(execSyncMock).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${appDirectory} --scope=shared --type=utils --name=navigation`,
      { stdio: 'inherit' },
    );

    expect(generateFilesMock).toHaveBeenCalledWith(tree, path.join(__dirname, `/${navigationLibFiles}`), libsPath, {});
    expect(appendFileContentMock).not.toHaveBeenCalled();
  });

  it('should validate first lines of generated files against templates', async () => {
    await runNavigationUtilsGenerator(tree, { appDirectory });

    assertFirstLine(path.join(__dirname, navigationLibFiles), libsPath, tree);
  });
});
