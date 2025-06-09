/// <reference types="jest" />
import * as path from 'path';
import { Tree } from '@nx/devkit';
import * as devkit from '@nx/devkit';
import generator from './generator';

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  generateFiles: jest.fn(),
  formatFiles: jest.fn(),
  installPackagesTask: jest.fn(),
}));

describe('generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = {
      exists: jest.fn(),
      delete: jest.fn(),
    } as any;
  });

  it('should delete existing Dockerfile', async () => {
    (tree.exists as jest.Mock).mockReturnValue(true);

    const result = await generator(tree);

    expect(tree.exists).toHaveBeenCalledWith('Dockerfile');
    expect(tree.delete).toHaveBeenCalledWith('Dockerfile');
    expect(devkit.generateFiles).toHaveBeenCalledWith(tree, path.join(__dirname, 'files'), '.', { tmpl: '' });
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);

    result();
    expect(devkit.installPackagesTask).toHaveBeenCalledWith(tree);
  });

  it('should not delete Dockerfile if it does not exist', async () => {
    (tree.exists as jest.Mock).mockReturnValue(false);

    await generator(tree);

    expect(tree.delete).not.toHaveBeenCalled();
    expect(devkit.generateFiles).toHaveBeenCalled();
    expect(devkit.formatFiles).toHaveBeenCalled();
  });
});
