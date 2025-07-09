/// <reference types="jest" />
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { dependencies } from '../../dependencies';
import { runApiClientGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
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
  output: {
    log: jest.fn(),
    warn: jest.fn(),
    bold: (text: string) => text,
  },
  addDependenciesToPackageJson: jest.fn(),
}));

describe('runApiClientGenerator', () => {
  let tree: any;
  let fileMap: Record<string, string>;

  beforeEach(() => {
    fileMap = {};
    tree = createTreeWithEmptyWorkspace();

    tree.write = jest.fn((filePath: string, content: string) => {
      fileMap[filePath.replace(/\\/g, '/')] = content;
    });

    tree.read = jest.fn((filePath: string) => {
      const normalized = filePath.replace(/\\/g, '/');

      return fileMap[normalized] ? Buffer.from(fileMap[normalized]) : null;
    });

    tree.exists = jest.fn((filePath: string) => {
      const normalized = filePath.replace(/\\/g, '/');

      return Object.prototype.hasOwnProperty.call(fileMap, normalized);
    });

    tree.delete = jest.fn();
    jest.clearAllMocks();
  });

  function verifyGeneratedFilesFirstLine(templateDir: string, targetDir: string): void {
    const entries = fs.readdirSync(templateDir, { withFileTypes: true });

    for (const entry of entries) {
      const templatePath = path.join(templateDir, entry.name);

      if (entry.isDirectory()) {
        verifyGeneratedFilesFirstLine(templatePath, path.join(targetDir, entry.name));
      } else {
        const expectedFirstLine = fs.readFileSync(templatePath, 'utf8').split('\n')[0].trim();
        const targetFile = path.join(targetDir, entry.name.replace(/\.template$/, '')).replace(/\\/g, '/');
        const generatedContent = tree.read(targetFile)?.toString();

        expect(generatedContent).toBeDefined();
        const actualFirstLine = generatedContent?.split('\n')[0].trim();
        expect(actualFirstLine).toBe(expectedFirstLine);
      }
    }
  }

  it('should generate the react-lib and delete index.ts', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    await runApiClientGenerator(tree, { name: 'my-app', directory: 'my-app' });

    expect(execSync).toHaveBeenCalledWith(
      'npx nx g react-lib --app=my-app --scope=shared --type=data-access --name=api-client',
      { stdio: 'inherit' },
    );

    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      path.join(__dirname, '/lib-files'),
      'libs/my-app',
      expect.objectContaining({
        name: 'my-app',
        libPath: '/my-app',
      }),
    );

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(tree, dependencies['api-client'], {});
    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(
      tree,
      dependencies['api-client'],
      {},
      'apps/my-app/package.json',
    );

    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);

    verifyGeneratedFilesFirstLine(path.join(__dirname, 'lib-files'), 'libs/my-app');
  });

  it('should not add app package.json dependencies if package.json does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await runApiClientGenerator(tree, { name: 'test', directory: 'my-app' });

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(tree, dependencies['api-client'], {});
    expect(devkit.addDependenciesToPackageJson).not.toHaveBeenCalledWith(
      tree,
      dependencies['api-client'],
      {},
      expect.any(String),
    );
  });
});
