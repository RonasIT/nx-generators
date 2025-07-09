/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { devDependencies } from '../../shared/dependencies';
import { repoConfigGenerator } from './generator';

jest.mock('@nx/devkit', () => {
  const actual = jest.requireActual('@nx/devkit');

  return {
    ...actual,
    readJson: jest.fn(),
    writeJson: jest.fn(),
    generateFiles: jest.fn((tree, src, dest, substitutions) => {
      const copyRecursive = (srcDir: string, destDir: string): void => {
        const entries = fs.readdirSync(srcDir, { withFileTypes: true });

        for (const entry of entries) {
          const srcPath = path.join(srcDir, entry.name);

          if (entry.isDirectory()) {
            copyRecursive(srcPath, path.join(destDir, entry.name));
          } else {
            const content = fs.readFileSync(srcPath, 'utf8');
            const rendered = content.replace(/__name__/g, substitutions.name ?? ''); // optionally render variables
            const targetPath = path
              .join(destDir, entry.name.replace(/\.template$/, ''))
              .split(path.sep)
              .join('/');
            tree.write(targetPath, rendered); // use the real virtual tree
          }
        }
      };

      copyRecursive(src, dest);
    }),
    addDependenciesToPackageJson: jest.fn(),
    formatFiles: jest.fn(),
    installPackagesTask: jest.fn(),
  };
});

describe('repoConfigGenerator', () => {
  let tree: devkit.Tree;

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace();
  });

  function verifyGeneratedFilesFirstLine(templatesDir: string, targetDir: string): void {
    const entries = fs.readdirSync(templatesDir, { withFileTypes: true });

    for (const entry of entries) {
      const templatePath = path.join(templatesDir, entry.name);

      if (entry.isDirectory()) {
        verifyGeneratedFilesFirstLine(templatePath, path.join(targetDir, entry.name));
      } else {
        const expectedFirstLine = fs.readFileSync(templatePath, 'utf8').split('\n')[0].trim();
        const targetPath = path
          .join(targetDir, entry.name.replace(/\.template$/, ''))
          .split(path.sep)
          .join('/');
        const generatedContent = tree.read(targetPath)?.toString();

        if (!generatedContent) {
          throw new Error(`Expected file not found in virtual tree: ${targetPath}`);
        }

        const actualFirstLine = generatedContent.split('\n')[0].trim();
        expect(actualFirstLine).toBe(expectedFirstLine);
      }
    }
  }

  it('should update package.json, generate files, add dependencies, format files and return install callback', async () => {
    const mockPackageJson = {
      name: '@myorg/my-project',
      scripts: {
        oldScript: 'echo old',
      },
    };
    (devkit.readJson as jest.Mock).mockReturnValue(mockPackageJson);

    const callback = await repoConfigGenerator(tree);

    expect(devkit.readJson).toHaveBeenCalledWith(tree, 'package.json');

    expect(devkit.writeJson).toHaveBeenCalledWith(
      tree,
      'package.json',
      expect.objectContaining({
        workspaces: ['apps/*'],
        scripts: expect.objectContaining({
          oldScript: 'echo old',
        }),
      }),
    );

    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('files'),
      '.',
      expect.objectContaining({
        name: 'myorg',
        formatName: expect.any(Function),
      }),
    );

    // Assert generated file contents match templates
    const templatePath = path.join(__dirname, 'files');
    verifyGeneratedFilesFirstLine(templatePath, '.');

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(tree, {}, devDependencies['repo-config']);
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);

    callback();
    expect(devkit.installPackagesTask).toHaveBeenCalledWith(tree);
  });
});
