/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import expoAppGenerator from './generator';

jest.mock('@nx/devkit', () => ({
  readJson: jest.fn(() => ({ scripts: { dev: 'old-dev' } })),
  writeJson: jest.fn(),
  readProjectConfiguration: jest.fn(() => ({ name: 'myapp', tags: [] })),
  updateProjectConfiguration: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  formatFiles: jest.fn(),
  generateFiles: jest.fn((tree: Tree, src: string, dest: string) => {
    const fs = require('fs');
    const path = require('path');

    function copyRecursive(srcDir: string, destDir: string): void {
      const entries = fs.readdirSync(srcDir, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);

        if (entry.isDirectory()) {
          copyRecursive(srcPath, path.join(destDir, entry.name));
        } else {
          const outputFilename = entry.name.replace(/\.template$/, '');
          const destPath = path.join(destDir, outputFilename);
          const content = fs.readFileSync(srcPath, 'utf8');
          // Normalize paths to forward slashes for Nx virtual FS:
          const virtualPath = destPath.split(path.sep).join('/');

          tree.write(virtualPath, content);
        }
      }
    }

    copyRecursive(src, dest.split(path.sep).join('/'));
  }),
  installPackagesTask: jest.fn(),
}));

jest.mock('child_process', () => ({ execSync: jest.fn() }));
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(() => true),
  rmSync: jest.fn(),
}));

jest.mock('../../shared/utils', () => ({
  confirm: jest.fn(() => Promise.resolve(true)),
  getImportPathPrefix: jest.fn(() => 'libs'),
  addNxAppTag: jest.fn(),
  formatName: jest.fn((v) => v),
  formatAppIdentifier: jest.fn(() => 'my-app-id'),
}));

describe('expoAppGenerator integration with file content checks', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.clearAllMocks();
  });

  it('should generate files and validate their first line', async () => {
    const callback = await expoAppGenerator(tree, {
      name: 'MyApp',
      directory: 'myapp',
      withStore: false,
      withFormUtils: false,
      withUIKitten: false,
      withSentry: false,
    });

    const appFilesDir = path.join(__dirname, 'app-files');
    const i18nDir = path.join(__dirname, 'i18n');

    const assertFirstLine = (sourceDir: string, targetRoot: string) => {
      const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) continue;
        const templatePath = path.join(sourceDir, entry.name);
        const expectedFirstLine = fs.readFileSync(templatePath, 'utf8').split('\n')[0].trim();

        const targetPath = path.join(targetRoot, entry.name.replace(/\.template$/, ''));
        const generatedContent = tree.read(targetPath)?.toString();

        if (!generatedContent) {
          throw new Error(`Expected file not found in virtual tree: ${targetPath}`);
        }
        expect(generatedContent).toBeDefined();
        const actualFirstLine = generatedContent?.split('\n')[0].trim();
        expect(actualFirstLine).toBe(expectedFirstLine);
      }
    };

    assertFirstLine(appFilesDir, 'apps/myapp');
    assertFirstLine(path.join(i18nDir, 'app'), 'i18n/myapp/app');
    assertFirstLine(path.join(i18nDir, 'shared'), 'i18n/myapp/shared');

    expect(callback).toBeInstanceOf(Function);
  });
});
