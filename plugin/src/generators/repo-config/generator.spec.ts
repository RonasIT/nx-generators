/// <reference types="jest" />
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { devDependencies } from '../../shared/dependencies';
import {
  addDependenciesMock,
  assertFirstLine,
  formatFilesMock,
  generateFilesMock,
  installPackagesTaskMock,
  readJsonMock,
  writeJsonMock,
} from '../../shared/tests-utils';
import { repoConfigGenerator } from './generator';

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
    readJsonMock.mockReturnValue(mockPackageJson);

    const callback = await repoConfigGenerator(tree);

    expect(readJsonMock).toHaveBeenCalledWith(tree, 'package.json');

    expect(writeJsonMock).toHaveBeenCalledWith(
      tree,
      'package.json',
      expect.objectContaining({
        workspaces: ['apps/*'],
        scripts: expect.objectContaining({
          oldScript: oldScript,
        }),
      }),
    );

    expect(generateFilesMock).toHaveBeenCalledWith(
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

    expect(addDependenciesMock).toHaveBeenCalledWith(tree, {}, devDependencies['repo-config']);
    expect(formatFilesMock).toHaveBeenCalledWith(tree);

    callback();
    expect(installPackagesTaskMock).toHaveBeenCalledWith(tree);
  });
});
