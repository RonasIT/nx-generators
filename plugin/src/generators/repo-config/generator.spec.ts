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
import engines from './engines';
import { repoConfigGenerator } from './generator';
import scripts from './scripts';

describe('repoConfigGenerator', () => {
  let tree: devkit.Tree;

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace();
  });

  it('should update package.json, generate files, add dependencies, format files and return install callback', async () => {
    tree.root = '/myorg';
    readJsonMock.mockReturnValue({ name: '@myorg/source' });

    const callback = await repoConfigGenerator(tree);

    expect(readJsonMock).toHaveBeenCalledWith(tree, 'package.json');

    expect(writeJsonMock).toHaveBeenCalledWith(
      tree,
      'package.json',
      expect.objectContaining({
        name: '@myorg/source',
        workspaces: ['apps/*'],
        scripts,
        engines,
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

  it('should set package name from workspace directory name', async () => {
    tree.root = '/my-project';
    readJsonMock.mockReturnValue({ name: '@org/source' });

    await repoConfigGenerator(tree);

    expect(writeJsonMock).toHaveBeenCalledWith(
      tree,
      'package.json',
      expect.objectContaining({ name: '@my-project/source' }),
    );

    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('files'),
      '.',
      expect.objectContaining({ name: 'my-project' }),
    );
  });
});
