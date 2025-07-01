/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { runUIKittenGenerator } from './generator';

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

    copyRecursive(src, dest);
  }),
  formatFiles: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  readJson: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.requireActual('fs').readdirSync,
  readFileSync: jest.requireActual('fs').readFileSync,
}));

const readJsonMock = devkit.readJson as jest.Mock;

describe('runUIKittenGenerator', () => {
  let tree: devkit.Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write('libs/myapp/shared/ui/styles/src/lib/index.ts', 'initial styles content\n');

    readJsonMock.mockImplementation((path) => {
      if (path === 'package.json') {
        return { name: '@org/myapp' };
      }

      return {};
    });

    jest.clearAllMocks();
  });

  function assertFirstLine(templateDir: string, targetDir: string, tree: devkit.Tree): void {
    const entries = fs.readdirSync(templateDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(templateDir, entry.name);

      if (entry.isDirectory()) {
        assertFirstLine(srcPath, path.join(targetDir, entry.name), tree);
      } else {
        const filename = entry.name.replace(/\.template$/, '');
        const targetPath = path.join(targetDir, filename).split(path.sep).join('/');
        const expectedFirstLine = fs.readFileSync(srcPath, 'utf8').split('\n')[0].trim();
        const content = tree.read(targetPath)?.toString();

        if (!content) {
          throw new Error(`Expected file not found: ${targetPath}`);
        }

        const actualFirstLine = content.split('\n')[0].trim();
        expect(actualFirstLine).toBe(expectedFirstLine);
      }
    }
  }

  it('should generate files and match first lines with templates', async () => {
    const options = { directory: 'myapp' };

    await runUIKittenGenerator(tree, options);

    const templateDir = path.join(__dirname, 'lib-files');
    const targetDir = 'libs/myapp';

    assertFirstLine(templateDir, targetDir, tree);
  });
});
