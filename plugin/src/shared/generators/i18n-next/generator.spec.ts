/// <reference types="jest" />
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { assertFirstLine, execSyncMock, formatFilesMock, readJsonMock } from '../../tests-utils';
import { runI18nNextGenerator } from './generator';

describe('runI18nNextGenerator', () => {
  let tree: devkit.Tree;

  const templatesDir = path.join(__dirname, 'lib-files');
  const targetDir = 'libs/myapp';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    readJsonMock.mockImplementation((_treeParam, pathParam) => {
      if (pathParam === 'package.json') {
        return { name: '@org/myapp' };
      }

      return {};
    });

    jest.clearAllMocks();
  });

  it('should run the i18n-next generator and update files correctly', async () => {
    const options = {
      directory: 'myapp',
      name: 'myapp',
    };

    await runI18nNextGenerator(tree, options);

    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=utils --name=i18n --withComponent=false',
      { stdio: 'inherit' },
    );

    expect(formatFilesMock).toHaveBeenCalledWith(tree);

    assertFirstLine(templatesDir, targetDir, tree);
  });
});
