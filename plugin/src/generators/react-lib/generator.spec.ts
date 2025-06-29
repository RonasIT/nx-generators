/// <reference types="jest" />
import { execSync } from 'child_process';
import * as devkit from '@nx/devkit';
import { addNxScopeTag, selectProject, confirm, askQuestion } from '../../shared/utils';
import { reactLibGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn().mockImplementation(() => ({
    run: jest.fn(),
  })),
}));

jest.mock('../../shared/utils', () => ({
  ...jest.requireActual('../../shared/utils'),
  addNxScopeTag: jest.fn(),
  constants: { sharedValue: 'shared' },
  formatName: jest.fn((name, capitalize) => (capitalize ? name.charAt(0).toUpperCase() + name.slice(1) : name)),
  selectProject: jest.fn(),
  validateLibraryType: jest.fn((type) => type),
  confirm: jest.fn(),
  askQuestion: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn(),
  formatFiles: jest.fn(),
  output: {
    log: jest.fn(),
    warn: jest.fn(),
    bold: (text: string) => text,
  },
  readJson: jest.fn(),
  writeJson: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  installPackagesTask: jest.fn(),
  readProjectConfiguration: jest.fn(() => ({ name: 'myapp', tags: [] })),
  getProjects: jest.fn(),
  Tree: jest.fn(), // only if used
}));

describe('reactLibGenerator', () => {
  const tree = {
    write: jest.fn(),
  } as any;

  const AutoCompleteMock = require('enquirer').AutoComplete;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate library with minimal options and no component', async () => {
    (selectProject as jest.Mock).mockResolvedValue({ name: 'myapp' });
    (askQuestion as jest.Mock).mockResolvedValue('myscope');
    (AutoCompleteMock as jest.Mock).mockImplementation(() => ({ run: jest.fn().mockResolvedValue('ui') }));
    (confirm as jest.Mock).mockResolvedValue(false);

    const options = {
      dryRun: false,
      name: 'mylib',
      withComponent: false,
      withComponentForwardRef: false,
      app: undefined,
      scope: undefined,
      type: undefined,
    };

    await reactLibGenerator(tree, options);

    expect(selectProject).toHaveBeenCalledWith(tree, 'application', expect.any(String));
    expect(askQuestion).toHaveBeenCalledWith("Enter the scope (e.g: profile) or 'shared': ");
    expect(AutoCompleteMock).toHaveBeenCalled();
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('npx nx g @nx/react:library'), { stdio: 'inherit' });
    expect(devkit.generateFiles).not.toHaveBeenCalled();
    expect(tree.write).not.toHaveBeenCalled();
    expect(addNxScopeTag).toHaveBeenCalledWith(tree, 'myscope');
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should generate library with component and forwardRef options', async () => {
    (selectProject as jest.Mock).mockResolvedValue({ name: 'myapp' });
    (askQuestion as jest.Mock).mockImplementation((question) => {
      if (question.includes('scope')) return Promise.resolve('myscope');
      if (question.includes('name of the library')) return Promise.resolve('mylib');

      return Promise.resolve('');
    });
    (AutoCompleteMock as jest.Mock).mockImplementation(() => ({ run: jest.fn().mockResolvedValue('features') }));
    (confirm as jest.Mock)
      .mockResolvedValueOnce(true) // withComponent
      .mockResolvedValueOnce(true); // withComponentForwardRef

    const options = {
      dryRun: false,
      name: undefined,
      withComponent: undefined,
      withComponentForwardRef: undefined,
      app: undefined,
      scope: undefined,
      type: undefined,
    };

    await reactLibGenerator(tree, options);

    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('npx nx g @nx/react:library'), { stdio: 'inherit' });

    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('files'),
      expect.stringContaining('libs/myapp/myscope/features/mylib/src'),
      expect.objectContaining({ name: 'Mylib' }),
    );
    expect(tree.write).toHaveBeenCalledWith(
      expect.stringContaining('libs/myapp/myscope/features/mylib/src/index.ts'),
      "export * from './lib';",
    );
    expect(addNxScopeTag).toHaveBeenCalledWith(tree, 'myscope');
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should warn if library directory name differs from library name', async () => {
    (selectProject as jest.Mock).mockResolvedValue({ name: 'myapp' });
    (askQuestion as jest.Mock).mockResolvedValue('myscope');
    (AutoCompleteMock as jest.Mock).mockImplementation(() => ({ run: jest.fn().mockResolvedValue('ui') }));
    (confirm as jest.Mock).mockResolvedValue(false);

    const outputWarnSpy = jest.spyOn(devkit.output, 'warn');

    const options = {
      dryRun: false,
      name: 'scope-mylib',
      withComponent: false,
      withComponentForwardRef: false,
      app: undefined,
      scope: 'scope',
      type: 'ui',
    };

    await reactLibGenerator(tree, options);

    expect(outputWarnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('The library directory was changed to'),
      }),
    );

    outputWarnSpy.mockRestore();
  });
});
