/// <reference types="jest" />
import * as path from 'path';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import {
  readJsonMock,
  readProjectConfigurationMock,
  confirmMock,
  assertFirstLine,
  existsSyncMock,
  execSyncMock,
} from '../../shared/utils/';
import expoAppGenerator from './generator';

const appName = 'myapp';
const directory = 'mobile';

describe('expoAppGenerator integration with file content checks', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.clearAllMocks();

    tree.write(
      'eslint.constraints.json',
      JSON.stringify(
        [
          { sourceTag: 'app:shared', onlyDependOnLibsWithTags: ['app:shared'] },
          { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
        ],
        null,
        2,
      ),
    );

    readJsonMock.mockImplementation((_tree, filePath) => {
      if (filePath.endsWith('package.json')) {
        return { scripts: { dev: 'old-dev' } };
      }

      if (filePath.endsWith('eslint.constraints.json')) {
        return [{ sourceTag: `app:${appName}` }];
      }

      return {};
    });

    confirmMock.mockResolvedValue(true);
  });

  it('should generate files and validate their first line when app already exists', async () => {
    // Simulate apps/mobile exists
    existsSyncMock.mockImplementation((filePath: string) => filePath.includes(`apps/${directory}`));

    readProjectConfigurationMock.mockReturnValue({
      name: appName,
      root: `apps/${directory}`,
      sourceRoot: `apps/${directory}/src`,
      projectType: 'application',
      tags: [],
      targets: {},
    });

    const callback = await expoAppGenerator(tree, {
      name: appName,
      directory: directory,
      withStore: false,
      withFormUtils: false,
      withUIKitten: false,
      withSentry: false,
    });

    const appFilesDir = path.join(__dirname, 'app-files');
    const i18nDir = path.join(__dirname, 'i18n');

    assertFirstLine(appFilesDir, `apps/${directory}`, tree, {
      placeholders: {
        libPath: `@proj/${directory}`,
      },
    });
    assertFirstLine(path.join(i18nDir, 'app'), `i18n/${directory}/app`, tree);
    assertFirstLine(path.join(i18nDir, 'shared'), `i18n/${directory}/shared`, tree);

    expect(callback).toBeInstanceOf(Function);

    // Should not call nx g
    expect(execSyncMock).not.toHaveBeenCalledWith(expect.stringContaining(`npx nx g @nx/expo:app`), expect.any(Object));
  });

  it('should generate new app if it does not exist', async () => {
    // Simulate apps/mobile does NOT exist
    existsSyncMock.mockReturnValue(false);

    const callback = await expoAppGenerator(tree, {
      name: appName,
      directory: directory,
      withStore: false,
      withFormUtils: false,
      withUIKitten: false,
      withSentry: false,
    });

    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(
        `npx nx g @nx/expo:app ${appName} --directory=apps/${directory} --tags="app:${directory}, type:app"`,
      ),
      { stdio: 'inherit' },
    );

    expect(callback).toBeInstanceOf(Function);
  });
});
