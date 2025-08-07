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
} from '../../shared/tests-utils';
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
      //generator deletes tsconfig.app
      ignoreFiles: ['tsconfig.app.json.template'],
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

  it('should call expected sub-generators and CLI commands when all options are true', async () => {
    existsSyncMock.mockReturnValue(false);

    const callback = await expoAppGenerator(tree, {
      name: appName,
      directory: directory,
      withStore: true,
      withFormUtils: true,
      withUIKitten: true,
      withSentry: true,
    });

    // Verify nx expo app generator was called
    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(
        `npx nx g @nx/expo:app ${appName} --directory=apps/${directory} --tags="app:${directory}, type:app"`,
      ),
      { stdio: 'inherit' },
    );

    // Verify all shared generators CLI commands were called
    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(`npx nx g react-lib --app=${directory} --scope=shared --type=utils --name=app-env`),
      { stdio: 'inherit' },
    );

    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(`npx nx g react-lib --app=${directory} --scope=shared --type=data-access --name=store`),
      { stdio: 'inherit' },
    );

    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(
        `npx nx g react-lib --app=${directory} --scope=shared --type=data-access --name=api-client`,
      ),
      { stdio: 'inherit' },
    );

    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(`npx nx g react-lib --app=${directory} --scope=shared --type=utils --name=form`),
      { stdio: 'inherit' },
    );

    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(
        `npx nx g react-lib --app=${directory} --scope=shared --type=features --name=user-theme-provider --withComponent=false`,
      ),
      { stdio: 'inherit' },
    );

    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(`npx nx g react-lib --app=${directory} --scope=shared --type=utils --name=navigation`),
      { stdio: 'inherit' },
    );

    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(
        `npx nx g react-lib --app=${directory} --scope=shared --type=ui --name=styles --withComponent=false`,
      ),
      { stdio: 'inherit' },
    );

    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(`npx nx g react-lib --app=${directory} --scope=shared --type=data-access --name=storage`),
      { stdio: 'inherit' },
    );

    // Callback returned should be a function
    expect(callback).toEqual(expect.any(Function));

    // Run the returned callback to trigger final commands
    callback();

    // Check Sentry CLI generation command was called on callback
    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(`npx nx g sentry --directory=apps/${directory}`),
      { stdio: 'inherit' },
    );
  });
});
