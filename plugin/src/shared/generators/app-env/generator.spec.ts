/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { BaseGeneratorType } from '../../enums';
import { runAppEnvGenerator } from './generator';

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

const execSyncMock = require('child_process').execSync as jest.Mock;

const generateFilesMock = devkit.generateFiles as jest.Mock;
const formatFilesMock = devkit.formatFiles as jest.Mock;

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
    const options = {
      name: 'myapp',
      directory: 'myapp',
      baseGeneratorType: BaseGeneratorType.EXPO_APP,
    };

    await runAppEnvGenerator(tree, options);

    // Check execSync called with expected nx generate command
    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=utils --name=app-env',
      { stdio: 'inherit' },
    );

    // Check generateFiles called with correct arguments
    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      path.join(__dirname, 'lib-files'),
      'libs/myapp',
      expect.objectContaining({
        name: 'myapp',
        directory: 'myapp',
        baseGeneratorType: 'expo-app',
        libPath: '@org/myapp',
        appType: 'EXPO',
        formatName: expect.any(Function),
        formatAppIdentifier: expect.any(Function),
      }),
    );

    // Assert generated file contents first line matches the templates
    const templateDir = path.join(__dirname, 'lib-files');
    const destDir = 'libs/myapp';
    assertFirstLine(templateDir, destDir, tree);

    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });
});
