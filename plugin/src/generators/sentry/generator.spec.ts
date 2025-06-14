/// <reference types="jest" />
import { Tree } from '@nx/devkit';
import * as devkit from '@nx/devkit';
import * as sharedUtils from '../../shared/utils';
import sentryGenerator from './generator';
import * as utils from './utils';

jest.mock('../../shared/utils', () => ({
  selectProject: jest.fn(),
  getAppFrameworkName: jest.fn(),
}));

jest.mock('./utils', () => ({
  generateSentryNext: jest.fn(),
  generateSentryExpo: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  formatFiles: jest.fn(),
  installPackagesTask: jest.fn(),
}));

describe('generator', () => {
  let tree: Tree;
  const mockTree = {} as unknown as Tree;

  beforeEach(() => {
    jest.clearAllMocks();
    tree = mockTree;
  });

  it('should use provided directory and generate for next.js', async () => {
    (sharedUtils.getAppFrameworkName as jest.Mock).mockReturnValue('next');

    const options = { directory: 'apps/my-app', dsn: '' };
    const result = await sentryGenerator(tree, options);

    expect(sharedUtils.getAppFrameworkName).toHaveBeenCalledWith(tree, 'apps/my-app');
    expect(utils.generateSentryNext).toHaveBeenCalledWith(tree, options, 'apps/my-app');
    expect(utils.generateSentryExpo).not.toHaveBeenCalled();
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);

    // Execute returned task
    result();
    expect(devkit.installPackagesTask).toHaveBeenCalledWith(tree);
  });

  it('should prompt for directory and generate for expo', async () => {
    (sharedUtils.selectProject as jest.Mock).mockResolvedValue({ path: 'apps/awesome-app' });
    (sharedUtils.getAppFrameworkName as jest.Mock).mockReturnValue('expo');

    const options = {};
    const result = await sentryGenerator(tree, options);

    expect(sharedUtils.selectProject).toHaveBeenCalledWith(tree, 'application', 'Select the application: ', true);
    expect(sharedUtils.getAppFrameworkName).toHaveBeenCalledWith(tree, 'apps/awesome-app');
    expect(utils.generateSentryExpo).toHaveBeenCalledWith(tree, options, 'apps/awesome-app');
    expect(utils.generateSentryNext).not.toHaveBeenCalled();
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);

    result();
    expect(devkit.installPackagesTask).toHaveBeenCalledWith(tree);
  });
});
