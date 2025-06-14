/// <reference types="jest" />
import * as child_process from 'child_process';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { runFormUtilsGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  formatFiles: jest.fn(),
  generateFiles: jest.fn(),
}));

describe('runFormUtilsGenerator', () => {
  const tree = {
    delete: jest.fn(),
  } as unknown as devkit.Tree;

  const options = { directory: 'my-app' };

  beforeEach(() => {
    jest.clearAllMocks();
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });

  it('should run nx generate, delete files, generate files, and format files', async () => {
    await runFormUtilsGenerator(tree, options);

    expect(child_process.execSync).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${options.directory} --scope=shared --type=utils --name=form`,
      { stdio: 'inherit' },
    );

    expect(tree.delete).toHaveBeenCalledWith(`libs/${options.directory}/shared/utils/form/src/index.ts`);

    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('/lib-files'),
      `libs/${options.directory}`,
      {},
    );

    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });
});
