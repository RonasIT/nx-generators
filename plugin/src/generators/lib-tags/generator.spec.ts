/// <reference types="jest" />
import {
  confirm,
  execSyncMock,
  formatFilesMock,
  getProjectsMock,
  verifyESLintConstraintsConfig,
} from '../../shared/utils';
import { libTagsGenerator } from './generator';
import * as utils from './utils';

jest.mock('../../shared/utils', () => {
  const actual = jest.requireActual('../../shared/utils');

  return {
    ...actual,
    confirm: jest.fn(),
    verifyESLintConstraintsConfig: jest.fn(),
  };
});

jest.mock('./utils', () => {
  const actual = jest.requireActual('./utils');

  return {
    ...actual,
    checkApplicationTags: jest.fn(),
    checkLibraryTags: jest.fn(),
  };
});

const asMock = <T extends (...args: Array<any>) => any>(fn: T): jest.MockedFunction<T> => fn as jest.MockedFunction<T>;

describe('libTagsGenerator', () => {
  let tree: any;
  const appName = 'app1';
  const libName = 'lib1';

  beforeEach(() => {
    tree = {} as any;
    jest.clearAllMocks();
  });

  it('should stop if there are unstaged changes and user declines confirmation', async () => {
    execSyncMock.mockReturnValue(' M somefile.ts');
    asMock(confirm).mockResolvedValue(false);

    await libTagsGenerator(tree, { skipRepoCheck: false });

    expect(confirm).toHaveBeenCalledWith('You have unstaged changes. Are you sure you want to continue?');
    expect(verifyESLintConstraintsConfig).not.toHaveBeenCalled();
  });

  it('should proceed if no unstaged changes', async () => {
    execSyncMock.mockReturnValue('');
    asMock(getProjectsMock).mockReturnValue(
      new Map([
        [appName, { name: appName, projectType: 'application', root: `apps/${appName}` }],
        [libName, { name: libName, projectType: 'library', root: `libs/${libName}` }],
      ]),
    );

    asMock(utils.checkApplicationTags).mockImplementation(undefined);
    asMock(utils.checkLibraryTags).mockImplementation(undefined);

    await libTagsGenerator(tree, { skipRepoCheck: false, silent: false });

    expect(verifyESLintConstraintsConfig).toHaveBeenCalledWith(tree);
    expect(utils.checkApplicationTags).toHaveBeenCalledTimes(1);
    expect(utils.checkLibraryTags).toHaveBeenCalledTimes(1);
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });

  it('should set context.log to noop if silent option is true', async () => {
    execSyncMock.mockReturnValue('');
    asMock(getProjectsMock).mockReturnValue(new Map());

    await libTagsGenerator(tree, { skipRepoCheck: true, silent: true });

    expect(verifyESLintConstraintsConfig).toHaveBeenCalled();
    expect(formatFilesMock).toHaveBeenCalled();
  });
});
