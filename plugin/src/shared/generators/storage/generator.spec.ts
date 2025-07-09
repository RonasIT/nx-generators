/// <reference types="jest" />
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { runStorageGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn((tree, src, dest) => {
    function copyRecursive(srcDir: string, destDir: string): void {
      const entries = fs.readdirSync(srcDir, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);

        if (entry.isDirectory()) {
          copyRecursive(srcPath, path.join(destDir, entry.name));
        } else {
          const filename = entry.name.replace(/\.template$/, '');
          const destPath = path.join(destDir, filename).split(path.sep).join('/');
          const content = fs.readFileSync(srcPath, 'utf8');
          tree.write(destPath, content);
        }
      }
    }
    copyRecursive(src, dest.split(path.sep).join('/'));
  }),
  formatFiles: jest.fn(),
  readJson: jest.fn(),
}));

const execSyncMock = child_process.execSync as jest.Mock;
const generateFilesMock = devkit.generateFiles as jest.Mock;
const formatFilesMock = devkit.formatFiles as jest.Mock;
const readJsonMock = devkit.readJson as jest.Mock;

function assertFirstLine(sourceDir: string, targetDir: string, tree: devkit.Tree): void {
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(sourceDir, entry.name);

    if (entry.isDirectory()) {
      assertFirstLine(srcPath, path.join(targetDir, entry.name), tree);
    } else {
      const targetFile = path
        .join(targetDir, entry.name.replace(/\.template$/, ''))
        .split(path.sep)
        .join('/');
      const expectedFirstLine = fs.readFileSync(srcPath, 'utf8').split('\n')[0].trim();
      const generatedContent = tree.read(targetFile)?.toString();

      if (!generatedContent) {
        throw new Error(`Expected file not found in virtual tree: ${targetFile}`);
      }

      const actualFirstLine = generatedContent.split('\n')[0].trim();
      expect(actualFirstLine).toBe(expectedFirstLine);
    }
  }
}

describe('runStorageGenerator', () => {
  let tree: devkit.Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    readJsonMock.mockImplementation((tree, path) => {
      if (path === 'package.json') {
        return { name: '@org/myapp' };
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

  it('should generate files with correct parameters and verify generated content', async () => {
    const options = { name: 'my-storage', directory: 'myapp' };

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

    // Assert the generated file first lines match the template files
    assertFirstLine(calledSourcePath, calledDestPath, tree);
  });

  it('should call formatFiles once', async () => {
    const options = { name: 'my-storage', directory: 'myapp' };
    await runStorageGenerator(tree, options);

    expect(formatFilesMock).toHaveBeenCalledTimes(1);
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });
});
