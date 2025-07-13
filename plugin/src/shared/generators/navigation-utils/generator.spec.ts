/// <reference types="jest" />
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { BaseGeneratorType } from '../../enums';
import * as utils from '../../utils';
import { runNavigationUtilsGenerator } from './generator';

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
}));

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  appendFileContent: jest.fn(),
}));

const execSyncMock = child_process.execSync as jest.Mock;
const generateFilesMock = devkit.generateFiles as jest.Mock;
const appendFileContentMock = utils.appendFileContent as jest.Mock;

describe('runNavigationUtilsGenerator', () => {
  let tree: devkit.Tree;
  const libsPath = 'libs/myapp';
  const commonLibFiles = 'common-lib-files';
  const nextAppLibFiles = 'next-app-lib-files';
  const indexFilePath = 'libs/myapp/shared/utils/navigation/src/index.ts';
  const appDirectory = 'myapp';
  const createOptions = (type: BaseGeneratorType): { appDirectory: string; baseGeneratorType: BaseGeneratorType } => ({
    appDirectory: 'myapp',
    baseGeneratorType: type,
  });

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Create dummy index.ts file that should be deleted
    tree.write(indexFilePath, 'export {};');

    jest.clearAllMocks();
  });

  it('should run react-lib generation and generate common files', async () => {
    await runNavigationUtilsGenerator(tree, createOptions(BaseGeneratorType.EXPO_APP));

    expect(execSyncMock).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${appDirectory} --scope=shared --type=utils --name=navigation`,
      { stdio: 'inherit' },
    );

    // generateFiles should be called once for common-lib-files
    expect(generateFilesMock).toHaveBeenCalledWith(tree, path.join(__dirname, `/${commonLibFiles}`), libsPath, {});

    // appendFileContent should NOT be called for non NEXT_APP
    expect(appendFileContentMock).not.toHaveBeenCalled();
  });

  it('should generate additional next-app files and append content for NEXT_APP type', async () => {
    await runNavigationUtilsGenerator(tree, createOptions(BaseGeneratorType.NEXT_APP));

    expect(generateFilesMock).toHaveBeenCalledWith(tree, path.join(__dirname, `/${commonLibFiles}`), libsPath, {});

    expect(generateFilesMock).toHaveBeenCalledWith(tree, path.join(__dirname, `/${nextAppLibFiles}`), libsPath, {});

    expect(appendFileContentMock).toHaveBeenCalledWith(
      'libs/myapp/shared/utils/navigation/src/lib/index.ts',
      `export * from './hooks';\nexport * from './types';`,
      tree,
    );
  });

  it('should validate first lines of generated files against templates', async () => {
    await runNavigationUtilsGenerator(tree, createOptions(BaseGeneratorType.NEXT_APP));

    function assertFirstLine(sourceDir: string, targetDir: string): void {
      const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(sourceDir, entry.name);

        if (entry.isDirectory()) {
          assertFirstLine(srcPath, path.join(targetDir, entry.name));
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

    // Assert for common-lib-files
    assertFirstLine(path.join(__dirname, commonLibFiles), libsPath);

    // Assert for next-app-lib-files
    assertFirstLine(path.join(__dirname, nextAppLibFiles), libsPath);
  });
});
