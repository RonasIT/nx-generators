/// <reference types="jest" />
import * as child_process from 'child_process';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import * as utils from '../../utils';
import { runI18nNextGenerator } from './generator';

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

jest.mock('../../utils', () => ({
  formatName: jest.fn().mockImplementation((name) => `formatted-${name}`),
  formatAppIdentifier: jest.fn().mockImplementation((name) => `app-${name}`),
  getImportPathPrefix: jest.fn(),
}));

describe('runI18nNextGenerator', () => {
  const tree = {
    delete: jest.fn(),
  } as unknown as devkit.Tree;

  const options = { name: 'testName', directory: 'testDir' };

  beforeEach(() => {
    jest.clearAllMocks();
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (utils.getImportPathPrefix as jest.Mock).mockReturnValue('@org');
  });

  it('should run nx generate, delete file, generate files and format', async () => {
    await runI18nNextGenerator(tree, options);

    expect(child_process.execSync).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${options.directory} --scope=shared --type=utils --name=i18n --withComponent=false`,
      { stdio: 'inherit' },
    );

    expect(tree.delete).toHaveBeenCalledWith(`libs/${options.directory}/shared/utils/i18n/src/index.ts`);

    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('lib-files'),
      `libs/${options.directory}`,
      expect.objectContaining({
        name: options.name,
        directory: options.directory,
        formatName: expect.any(Function),
        formatAppIdentifier: expect.any(Function),
        libPath: `@org/${options.directory}`,
      }),
    );

    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });
});
