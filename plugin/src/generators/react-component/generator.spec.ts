/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { kebabCase } from 'lodash';
import { appendFileContent, getNxLibsPaths } from '../../shared/utils';
import { reactComponentGenerator } from './generator';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn().mockImplementation(() => ({
    run: jest.fn(),
  })),
}));

jest.mock('../../shared/utils', () => ({
  getNxLibsPaths: jest.fn(),
  appendFileContent: jest.fn(),
  formatName: jest.fn((name, capitalize) => (capitalize ? name.charAt(0).toUpperCase() + name.slice(1) : name)),
}));

jest.mock('@nx/devkit', () => {
  const original = jest.requireActual('@nx/devkit');

  return {
    ...original,
    generateFiles: jest.fn(),
    formatFiles: jest.fn(),
  };
});

describe('reactComponentGenerator', () => {
  const tree = {
    write: jest.fn(),
  } as any;

  const libPaths = ['libs/features/my-feature', 'libs/ui/my-ui'];
  const optionsBase = {
    name: 'MyComponent',
    subcomponent: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getNxLibsPaths as jest.Mock).mockReturnValue(libPaths);
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  it('should prompt for library path and generate files', async () => {
    const runMock = jest.fn().mockResolvedValue(libPaths[0]);
    (require('enquirer').AutoComplete as jest.Mock).mockImplementation(() => ({
      run: runMock,
    }));

    await reactComponentGenerator(tree, optionsBase);

    expect(runMock).toHaveBeenCalled();
    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      path.join(expect.any(String), 'files'),
      `${libPaths[0]}/lib`,
      expect.objectContaining({
        name: 'MyComponent',
      }),
    );
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should update indexes correctly if subcomponent and paths do not exist', async () => {
    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      // Simulate that libRootPath and componentsPath do not exist
      if (p.endsWith('/lib') || p.endsWith('/lib/components')) {
        return false;
      }

      return !p.endsWith('/lib/components/index.ts');
    });

    const runMock = jest.fn().mockResolvedValue(libPaths[0]);
    (require('enquirer').AutoComplete as jest.Mock).mockImplementation(() => ({
      run: runMock,
    }));

    const options = { ...optionsBase, subcomponent: true };
    await reactComponentGenerator(tree, options);

    // Should append to main index.ts and lib index.ts because paths don't exist
    expect(appendFileContent).toHaveBeenCalledWith(`${libPaths[0]}/index.ts`, `export * from './lib';\n`, tree);
    expect(appendFileContent).toHaveBeenCalledWith(
      `${libPaths[0]}/lib/index.ts`,
      `export * from './components';\n`,
      tree,
    );

    // Should create components index file because it doesn't exist
    expect(tree.write).toHaveBeenCalledWith(
      `${libPaths[0]}/lib/components/index.ts`,
      `export * from './${kebabCase(options.name)}';\n`,
    );

    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should append to components index if it exists', async () => {
    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      if (p.endsWith('/lib') || p.endsWith('/lib/components')) {
        return true;
      }

      return !!p.endsWith('/lib/components/index.ts');
    });

    const runMock = jest.fn().mockResolvedValue(libPaths[1]);
    (require('enquirer').AutoComplete as jest.Mock).mockImplementation(() => ({
      run: runMock,
    }));

    const options = { ...optionsBase, subcomponent: true };
    await reactComponentGenerator(tree, options);

    expect(appendFileContent).toHaveBeenCalledWith(
      `${libPaths[1]}/lib/components/index.ts`,
      `export * from './${kebabCase(options.name)}';\n`,
      tree,
    );

    expect(tree.write).not.toHaveBeenCalledWith(expect.stringContaining('index.ts'));

    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });
});
