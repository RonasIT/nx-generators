/// <reference types="jest" />
import { execSync } from 'child_process';
import * as path from 'path';
import { Tree } from '@nx/devkit';
import * as devkit from '@nx/devkit';
import config from './config';
import codeChecksGenerator from './generator';
import scripts from './scripts';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  readJson: jest.fn(),
  writeJson: jest.fn(),
  generateFiles: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  formatFiles: jest.fn(),
  installPackagesTask: jest.fn(),
}));

describe('codeChecksGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = {
      delete: jest.fn(),
      read: jest.fn(),
      write: jest.fn(),
    } as any;

    (devkit.readJson as jest.Mock).mockImplementation((_, file) => {
      if (file === 'package.json') {
        return { scripts: {} };
      }

      if (file === 'tsconfig.base.json') {
        return { compilerOptions: {} };
      }

      return {};
    });

    (tree.read as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath === '.gitignore') return Buffer.from('node_modules\n');
      if (filePath === '.prettierignore') return Buffer.from('');

      return null;
    });
  });

  it('should update configs and generate files', async () => {
    const options = { tmpl: '', name: '' };

    const result = await codeChecksGenerator(tree, options);

    expect(tree.delete).toHaveBeenCalledWith('.eslintrc.json');
    expect(tree.delete).toHaveBeenCalledWith('eslint.config.cjs');
    expect(tree.delete).toHaveBeenCalledWith('eslint.config.mjs');
    expect(tree.delete).toHaveBeenCalledWith('.prettierrc');

    expect(execSync).toHaveBeenCalledWith('npx mrm@2 lint-staged', { stdio: 'inherit' });

    expect(devkit.writeJson).toHaveBeenCalledWith(
      tree,
      'package.json',
      expect.objectContaining({
        'lint-staged': config['lint-staged'],
        scripts: expect.objectContaining(scripts),
      }),
    );

    expect(devkit.writeJson).toHaveBeenCalledWith(
      tree,
      'tsconfig.base.json',
      expect.objectContaining({
        compilerOptions: expect.objectContaining(config.tsconfig),
      }),
    );

    expect(tree.write).toHaveBeenCalledWith('.gitignore', expect.stringContaining('.eslintcache'));
    expect(tree.write).toHaveBeenCalledWith('.prettierignore', expect.stringContaining('**/actions.ts'));

    expect(devkit.generateFiles).toHaveBeenCalledWith(tree, path.join(__dirname, 'files'), '.', options);

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalled();

    expect(devkit.formatFiles).toHaveBeenCalled();

    result();
    expect(devkit.installPackagesTask).toHaveBeenCalledWith(tree);
  });
});
