/// <reference types="jest" />
import * as child_process from 'child_process';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { runStorageGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn(),
  formatFiles: jest.fn(),
  readJson: jest.fn(),
}));

const execSyncMock = child_process.execSync as jest.Mock;
const generateFilesMock = devkit.generateFiles as jest.Mock;
const formatFilesMock = devkit.formatFiles as jest.Mock;
const readJsonMock = devkit.readJson as jest.Mock;

describe('runStorageGenerator', () => {
  let tree: devkit.Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    readJsonMock.mockImplementation((tree, path) => {
      if (path === 'package.json') {
        return { name: '@org/myapp' }; // <- mocked name for getImportPathPrefix
      }

      return {};
    });

    jest.clearAllMocks();
  });

  it('should call execSync to generate react-lib', async () => {
    const options = { name: 'my-storage', directory: 'myapp' };
    await runStorageGenerator(tree, options);

    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=data-access --name=storage',
      { stdio: 'inherit' },
    );
  });

  it('should delete existing index.ts', async () => {
    const options = { name: 'my-storage', directory: 'myapp' };
    const indexPath = `libs/myapp/shared/data-access/storage/src/index.ts`;
    tree.write(indexPath, 'export {}');
    expect(tree.exists(indexPath)).toBe(true);

    await runStorageGenerator(tree, options);

    expect(tree.exists(indexPath)).toBe(false);
  });

  it('should generate files with correct parameters and verify generated content', async () => {
    const options = { name: 'my-storage', directory: 'myapp' };

    await runStorageGenerator(tree, options);

    // Check generateFiles was called correctly
    expect(generateFilesMock).toHaveBeenCalledTimes(1);
    const [calledTree, calledSourcePath, calledDestPath, calledTemplateVars] = generateFilesMock.mock.calls[0];

    expect(calledTree).toBe(tree);
    expect(calledSourcePath).toBe(path.join(__dirname, '/lib-files'));
    expect(calledDestPath).toBe(`libs/${options.directory}`);

    // Check template vars contains formatName, formatAppIdentifier, libPath, and options spread
    expect(calledTemplateVars).toMatchObject({
      name: options.name,
      directory: options.directory,
      formatName: expect.any(Function),
      formatAppIdentifier: expect.any(Function),
      libPath: expect.any(String),
    });

    // You can further test the behavior of formatName, formatAppIdentifier here if desired
  });

  it('should call formatFiles once', async () => {
    const options = { name: 'my-storage', directory: 'myapp' };
    await runStorageGenerator(tree, options);
    expect(formatFilesMock).toHaveBeenCalledTimes(1);
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });
});
