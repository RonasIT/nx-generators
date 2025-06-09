/// <reference types="jest" />
import * as path from 'path';
import {
  Tree,
  formatFiles,
  installPackagesTask,
  generateFiles,
  readJson,
  writeJson,
  addDependenciesToPackageJson,
} from '@nx/devkit';
import { devDependencies } from '../../shared/dependencies';
import * as sharedUtils from '../../shared/utils';
import { repoConfigGenerator } from './generator';

jest.mock('@nx/devkit');
jest.mock('../../shared/utils', () => ({
  getProjectName: jest.fn(),
  formatName: jest.fn(),
}));

describe('repoConfigGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = {
      delete: jest.fn(),
      read: jest.fn(),
      write: jest.fn(),
    } as any;

    (readJson as jest.Mock).mockReturnValue({
      name: 'repo-name',
      scripts: { existing: 'echo existing' },
    });

    (sharedUtils.getProjectName as jest.Mock).mockReturnValue('RepoName');
  });

  it('should delete README.md', async () => {
    await repoConfigGenerator(tree);
    expect(tree.delete).toHaveBeenCalledWith('README.md');
  });

  it('should update package.json with workspaces and merged scripts', async () => {
    await repoConfigGenerator(tree);

    expect(readJson).toHaveBeenCalledWith(tree, 'package.json');

    expect(writeJson).toHaveBeenCalledWith(tree, 'package.json', {
      name: 'repo-name',
      scripts: {
        ...require('./scripts').default,
        existing: 'echo existing',
      },
      workspaces: ['apps/*'],
    });
  });

  it('should generate files with formatName and project name', async () => {
    await repoConfigGenerator(tree);

    expect(sharedUtils.getProjectName).toHaveBeenCalledWith('repo-name');

    expect(generateFiles).toHaveBeenCalledWith(
      tree,
      path.join(__dirname, 'files'),
      '.',
      expect.objectContaining({
        name: 'RepoName',
        formatName: expect.any(Function),
      }),
    );
  });

  it('should add repo-config devDependencies', async () => {
    await repoConfigGenerator(tree);

    expect(addDependenciesToPackageJson).toHaveBeenCalledWith(tree, {}, devDependencies['repo-config']);
  });

  it('should call formatFiles and return installPackagesTask', async () => {
    const formatFilesMock = formatFiles as jest.Mock;
    const installPackagesTaskMock = installPackagesTask as jest.Mock;

    formatFilesMock.mockResolvedValue(undefined);
    installPackagesTaskMock.mockImplementation(() => 'install-task');

    const result = await repoConfigGenerator(tree);
    expect(formatFilesMock).toHaveBeenCalledWith(tree);

    result();
    expect(installPackagesTaskMock).toHaveBeenCalledWith(tree);
  });
});
