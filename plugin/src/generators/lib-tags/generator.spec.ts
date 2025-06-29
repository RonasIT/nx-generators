/// <reference types="jest" />
import { execSync } from 'child_process';
import * as devkit from '@nx/devkit';
import { confirm, verifyESLintConstraintsConfig } from '../../shared/utils';
import { libTagsGenerator } from './generator';
import * as utils from './utils';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('../../shared/utils', () => ({
  confirm: jest.fn(),
  verifyESLintConstraintsConfig: jest.fn(),
}));

jest.mock('./utils', () => ({
  checkApplicationTags: jest.fn(),
  checkLibraryTags: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  getProjects: jest.fn(),
  formatFiles: jest.fn(),
  output: {
    log: jest.fn(),
    bold: (t: string) => t,
  },
}));

describe('libTagsGenerator', () => {
  const tree = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should stop if unstaged changes and user declines confirmation', async () => {
    (execSync as jest.Mock).mockReturnValue(' M somefile.ts');
    (confirm as jest.Mock).mockResolvedValue(false);

    await libTagsGenerator(tree, { skipRepoCheck: false });

    expect(confirm).toHaveBeenCalledWith('You have unstaged changes. Are you sure you want to continue?');
    expect(verifyESLintConstraintsConfig).not.toHaveBeenCalled();
  });

  it('should proceed if no unstaged changes', async () => {
    (execSync as jest.Mock).mockReturnValue('');
    (devkit.getProjects as jest.Mock).mockReturnValue(
      new Map([
        ['app1', { name: 'app1', projectType: 'application', root: 'apps/app1' }],
        ['lib1', { name: 'lib1', projectType: 'library', root: 'libs/lib1' }],
      ]),
    );

    (utils.checkApplicationTags as jest.Mock).mockImplementation(undefined);
    (utils.checkLibraryTags as jest.Mock).mockImplementation(undefined);

    await libTagsGenerator(tree, { skipRepoCheck: false, silent: false });

    expect(verifyESLintConstraintsConfig).toHaveBeenCalledWith(tree);
    expect(utils.checkApplicationTags).toHaveBeenCalledTimes(1);
    expect(utils.checkLibraryTags).toHaveBeenCalledTimes(1);
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should set context.log to noop if silent option is true', async () => {
    (execSync as jest.Mock).mockReturnValue('');
    (devkit.getProjects as jest.Mock).mockReturnValue(new Map());

    await libTagsGenerator(tree, { skipRepoCheck: true, silent: true });

    expect(verifyESLintConstraintsConfig).toHaveBeenCalled();
    expect(devkit.formatFiles).toHaveBeenCalled();
  });
});
