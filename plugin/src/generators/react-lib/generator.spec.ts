/// <reference types="jest" />
import * as child_process from 'child_process';
import { Tree, generateFiles, formatFiles, output } from '@nx/devkit';
import * as utils from '../../shared/utils';
import { reactLibGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn(),
  formatFiles: jest.fn(),
  output: {
    warn: jest.fn(),
    bold: (text: string) => text,
  },
}));

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn().mockImplementation(() => ({
    run: jest.fn().mockResolvedValue('features'),
  })),
}));

jest.mock('../../shared/utils', () => ({
  ...jest.requireActual('../../shared/utils'),
  askQuestion: jest.fn(),
  confirm: jest.fn(),
  formatName: jest.fn((name) => name),
  getLibDirectoryName: jest.fn((name) => name),
  addNxScopeTag: jest.fn(),
  selectProject: jest.fn(),
  validateLibraryType: jest.fn((type) => type),
}));

describe('reactLibGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = {
      write: jest.fn(),
    } as any;

    jest.clearAllMocks();

    (utils.selectProject as jest.Mock).mockResolvedValue({ name: 'my-app' });
    (utils.askQuestion as jest.Mock).mockResolvedValue('profile');
    (utils.confirm as jest.Mock).mockResolvedValue(true);
    (utils.getLibDirectoryName as jest.Mock).mockReturnValue('settings');
  });

  it('should run nx generate command with expected options and generate files if withComponent is true', async () => {
    await reactLibGenerator(tree, {
      name: 'settings',
      type: 'features',
      withComponent: true,
      dryRun: false,
    });

    expect(child_process.execSync).toHaveBeenCalledWith(
      expect.stringContaining(
        'npx nx g @nx/react:library --skipPackageJson --unitTestRunner=none --tags="app:my-app, scope:profile, type:features" --name=my-app/profile/features/settings libs/my-app/profile/features/settings --linter=eslint --component=false --bundler=none --style=scss',
      ),
      { stdio: 'inherit' },
    );

    expect(generateFiles).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('/files'),
      expect.stringContaining('libs/my-app/profile/features/settings/src'),
      expect.objectContaining({
        name: 'settings',
      }),
    );

    expect(tree.write).toHaveBeenCalledWith(expect.stringContaining('/index.ts'), `export * from './lib';`);

    expect(utils.addNxScopeTag).toHaveBeenCalledWith(tree, 'profile');
    expect(formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should print a warning if libDirectoryName differs from options.name', async () => {
    (utils.getLibDirectoryName as jest.Mock).mockReturnValue('something-else');

    await reactLibGenerator(tree, {
      name: 'settings',
      type: 'features',
      withComponent: true,
    });

    expect(output.warn).toHaveBeenCalledWith({
      title: expect.stringContaining('The library directory was changed to'),
    });
  });

  it('should prompt for missing fields', async () => {
    (utils.askQuestion as jest.Mock)
      .mockResolvedValueOnce('profile') // scope
      .mockResolvedValueOnce('settings'); // name

    await reactLibGenerator(tree, {
      // Only app is missing, type will be selected via AutoComplete
    });

    expect(utils.selectProject).toHaveBeenCalled();
    expect(utils.askQuestion).toHaveBeenCalledTimes(2);
    expect(utils.confirm).toHaveBeenCalled();
  });

  it('should append --dry-run if dryRun is true', async () => {
    await reactLibGenerator(tree, {
      name: 'lib',
      type: 'features',
      withComponent: false,
      dryRun: true,
    });

    expect(child_process.execSync).toHaveBeenCalledWith(expect.stringContaining('--dry-run'), { stdio: 'inherit' });
  });
});
