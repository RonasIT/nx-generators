/// <reference types="jest" />
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { BaseGeneratorType } from '../../enums';
import { assertFirstLine, mockGenerateFiles } from '../../utils';
import { runAppEnvGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn((tree, src, dest, vars) => {
    mockGenerateFiles(tree, src, dest, vars);
  }),
  formatFiles: jest.fn(),
  readJson: jest.fn(),
}));

const execSyncMock = require('child_process').execSync as jest.Mock;

const generateFilesMock = devkit.generateFiles as jest.Mock;
const formatFilesMock = devkit.formatFiles as jest.Mock;

describe('runAppEnvGenerator', () => {
  let tree: ReturnType<typeof createTreeWithEmptyWorkspace>;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    tree.write('libs/myapp/shared/utils/app-env/src/index.ts', 'export {}');
    tree.write('package.json', JSON.stringify({ name: '@org/workspace' }, null, 2));

    (devkit.readJson as jest.Mock).mockImplementation((tree, path) => {
      if (path === 'package.json') {
        return { name: '@org/workspace' };
      }

      return {};
    });

    jest.clearAllMocks();
  });

  it('should generate app-env lib, delete default index.ts and generate custom files', async () => {
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
