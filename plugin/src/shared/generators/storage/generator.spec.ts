/// <reference types="jest" />
import * as child_process from 'child_process';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { assertFirstLine, mockGenerateFiles } from '../../utils';
import { runStorageGenerator } from './generator';

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

const execSyncMock = child_process.execSync as jest.Mock;
const generateFilesMock = devkit.generateFiles as jest.Mock;
const formatFilesMock = devkit.formatFiles as jest.Mock;
const readJsonMock = devkit.readJson as jest.Mock;

describe('runStorageGenerator', () => {
  let tree: devkit.Tree;
  const options = { name: 'my-storage', directory: 'myapp' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    readJsonMock.mockImplementation((_tree, path) => {
      if (path === 'package.json') {
        return { name: '@org/myapp' };
      }

      return {};
    });

    jest.clearAllMocks();
  });

  it('should call execSync to generate react-lib', async () => {
    await runStorageGenerator(tree, options);

    expect(execSyncMock).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${options.directory} --scope=shared --type=data-access --name=storage`,
      { stdio: 'inherit' },
    );
  });

  it('should generate files with correct parameters and verify generated content', async () => {
    await runStorageGenerator(tree, options);

    expect(generateFilesMock).toHaveBeenCalledTimes(1);
    const [calledTree, calledSourcePath, calledDestPath, calledVars] = generateFilesMock.mock.calls[0];

    expect(calledTree).toBe(tree);
    expect(calledSourcePath).toBe(path.join(__dirname, 'lib-files'));
    expect(calledDestPath).toBe(`libs/${options.directory}`);

    expect(calledVars).toMatchObject({
      name: options.name,
      directory: options.directory,
      formatName: expect.any(Function),
      formatAppIdentifier: expect.any(Function),
      libPath: expect.any(String),
    });

    assertFirstLine(calledSourcePath, calledDestPath, tree);
  });

  it('should call formatFiles once', async () => {
    await runStorageGenerator(tree, options);

    expect(formatFilesMock).toHaveBeenCalledTimes(1);
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });
});
