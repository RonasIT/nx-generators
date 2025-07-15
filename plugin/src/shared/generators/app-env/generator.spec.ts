/// <reference types="jest" />
import * as path from 'path';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { BaseGeneratorType } from '../../enums';
import { assertFirstLine, execSyncMock, formatFilesMock, generateFilesMock, readJsonMock } from '../../utils';
import { runAppEnvGenerator } from './generator';

describe('runAppEnvGenerator', () => {
  let tree: ReturnType<typeof createTreeWithEmptyWorkspace>;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    tree.write('libs/myapp/shared/utils/app-env/src/index.ts', 'export {}');
    tree.write('package.json', JSON.stringify({ name: '@org/workspace' }, null, 2));

    readJsonMock.mockImplementation((_tree, path) => {
      if (path === 'package.json') {
        return { name: '@org/workspace' };
      }

      return {};
    });

    jest.clearAllMocks();
  });

  it('should generate app-env lib and generate custom files', async () => {
    const appName = 'myapp';
    const destDir = 'libs/myapp';
    const options = {
      name: appName,
      directory: appName,
      baseGeneratorType: BaseGeneratorType.EXPO_APP,
    };

    await runAppEnvGenerator(tree, options);

    // Check execSync called with expected nx generate command
    expect(execSyncMock).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${appName} --scope=shared --type=utils --name=app-env`,
      { stdio: 'inherit' },
    );

    // Check generateFiles called with correct arguments
    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      path.join(__dirname, 'lib-files'),
      destDir,
      expect.objectContaining({
        name: appName,
        directory: appName,
        baseGeneratorType: BaseGeneratorType.EXPO_APP,
        libPath: `@org/${appName}`,
        appType: 'EXPO',
        formatName: expect.any(Function),
        formatAppIdentifier: expect.any(Function),
      }),
    );

    const templateDir = path.join(__dirname, 'lib-files');
    assertFirstLine(templateDir, destDir, tree, {
      placeholders: {
        name: appName,
        directory: appName,
        baseGeneratorType: BaseGeneratorType.EXPO_APP,
        libPath: `@org/${appName}`,
        appType: 'EXPO',
      },
    });

    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });
});
