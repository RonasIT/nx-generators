/// <reference types="jest" />
import { formatFiles, installPackagesTask } from '@nx/devkit';
import * as utils from '../../shared/utils';
import { sentryGenerator } from './generator';
import * as sentryUtils from './utils';

jest.mock('@nx/devkit', () => ({
  formatFiles: jest.fn(),
  installPackagesTask: jest.fn(),
}));

jest.mock('../../shared/utils', () => ({
  selectProject: jest.fn(),
  getAppFrameworkName: jest.fn(),
}));

jest.mock('./utils', () => ({
  generateSentryNext: jest.fn(),
  generateSentryExpo: jest.fn(),
}));

describe('sentryGenerator', () => {
  const tree = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should select project directory if not provided', async () => {
    (utils.selectProject as jest.Mock).mockResolvedValue({ path: 'apps/my-app' });
    (utils.getAppFrameworkName as jest.Mock).mockReturnValue('next');

    const callback = await sentryGenerator(tree, { directory: undefined });

    expect(utils.selectProject).toHaveBeenCalledWith(tree, 'application', 'Select the application: ', true);
    expect(utils.getAppFrameworkName).toHaveBeenCalledWith(tree, 'apps/my-app');
    expect(sentryUtils.generateSentryNext).toHaveBeenCalledWith(tree, { directory: 'apps/my-app' }, 'apps/my-app');
    expect(sentryUtils.generateSentryExpo).not.toHaveBeenCalled();
    expect(formatFiles).toHaveBeenCalledWith(tree);

    callback();
    expect(installPackagesTask).toHaveBeenCalledWith(tree);
  });

  it('should call generateSentryNext when framework is next', async () => {
    (utils.selectProject as jest.Mock).mockResolvedValue({ path: 'apps/my-app' });
    (utils.getAppFrameworkName as jest.Mock).mockReturnValue('next');

    await sentryGenerator(tree, { directory: 'apps/my-app' });

    expect(sentryUtils.generateSentryNext).toHaveBeenCalledWith(tree, { directory: 'apps/my-app' }, 'apps/my-app');
    expect(sentryUtils.generateSentryExpo).not.toHaveBeenCalled();
  });

  it('should call generateSentryExpo when framework is expo', async () => {
    (utils.getAppFrameworkName as jest.Mock).mockReturnValue('expo');

    await sentryGenerator(tree, { directory: 'apps/my-expo-app' });

    expect(sentryUtils.generateSentryExpo).toHaveBeenCalledWith(
      tree,
      { directory: 'apps/my-expo-app' },
      'apps/my-expo-app',
    );
    expect(sentryUtils.generateSentryNext).not.toHaveBeenCalled();
  });

  it('should do nothing if framework is unknown', async () => {
    (utils.getAppFrameworkName as jest.Mock).mockReturnValue('unknown');

    await sentryGenerator(tree, { directory: 'apps/unknown' });

    expect(sentryUtils.generateSentryNext).not.toHaveBeenCalled();
    expect(sentryUtils.generateSentryExpo).not.toHaveBeenCalled();
    expect(formatFiles).toHaveBeenCalledWith(tree);
  });
});
