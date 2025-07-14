/// <reference types="jest" />
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { devDependencies } from '../../shared/dependencies';
import { assertFirstLine, mockGenerateFiles } from '../../shared/utils';
import { repoConfigGenerator } from './generator';

jest.mock('@nx/devkit', () => {
  const actual = jest.requireActual('@nx/devkit');

  return {
    ...actual,
    readJson: jest.fn(),
    writeJson: jest.fn(),
    generateFiles: jest.fn((tree, src, dest, vars) => {
      mockGenerateFiles(tree, src, dest, vars);
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

  it('should update package.json, generate files, add dependencies, format files and return install callback', async () => {
    const oldScript = 'echo old';
    const mockPackageJson = {
      name: '@myorg/my-project',
      scripts: {
        oldScript: oldScript,
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
          oldScript: oldScript,
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

    const templatesDir = path.join(__dirname, 'files');
    assertFirstLine(templatesDir, '.', tree, {
      placeholders: { name: 'myorg' },
    });

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(tree, {}, devDependencies['repo-config']);
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);

    callback();
    expect(devkit.installPackagesTask).toHaveBeenCalledWith(tree);
  });
});
