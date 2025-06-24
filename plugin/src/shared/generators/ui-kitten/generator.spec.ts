/// <reference types="jest" />
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { runUIKittenGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => {
  const original = jest.requireActual('@nx/devkit');

  return {
    ...original,
    generateFiles: jest.fn(),
    formatFiles: jest.fn(),
    addDependenciesToPackageJson: jest.fn(),
  };
});

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

const execSyncMock = child_process.execSync as jest.Mock;
const generateFilesMock = devkit.generateFiles as jest.Mock;
const formatFilesMock = devkit.formatFiles as jest.Mock;
const addDependenciesMock = devkit.addDependenciesToPackageJson as jest.Mock;
const existsSyncMock = fs.existsSync as jest.Mock;

describe('runUIKittenGenerator', () => {
  let tree: devkit.Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Setup initial styles index file
    tree.write('libs/myapp/shared/ui/styles/src/lib/index.ts', 'initial styles content\n');

    jest.clearAllMocks();
  });

  it('should call execSync with correct command', async () => {
    const options = { directory: 'myapp' };

    await runUIKittenGenerator(tree, options);

    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=features --name=user-theme-provider --withComponent=false',
      { stdio: 'inherit' },
    );
  });

  it('should delete the user-theme-provider index.ts file', async () => {
    const options = { directory: 'myapp' };
    const indexPath = 'libs/myapp/shared/features/user-theme-provider/src/index.ts';

    tree.write(indexPath, 'export {}');
    expect(tree.exists(indexPath)).toBe(true);

    await runUIKittenGenerator(tree, options);

    expect(tree.exists(indexPath)).toBe(false);
  });

  it('should call generateFiles with correct arguments', async () => {
    const options = { directory: 'myapp' };
    await runUIKittenGenerator(tree, options);

    expect(generateFilesMock).toHaveBeenCalledTimes(1);
    const [calledTree, calledSourcePath, calledDestPath, calledVars] = generateFilesMock.mock.calls[0];

    expect(calledTree).toBe(tree);
    expect(calledSourcePath).toBe(path.join(__dirname, 'lib-files'));
    expect(calledDestPath).toBe('libs/myapp');

    expect(calledVars).toMatchObject({
      directory: options.directory,
      formatName: expect.any(Function),
      formatAppIdentifier: expect.any(Function),
      libPath: expect.any(String),
    });
  });

  it('should update styles lib index file with new exports', async () => {
    const options = { directory: 'myapp' };
    const stylesIndexPath = 'libs/myapp/shared/ui/styles/src/lib/index.ts';

    await runUIKittenGenerator(tree, options);

    const updatedContent = tree.read(stylesIndexPath, 'utf-8');
    expect(updatedContent).toContain('initial styles content');
    expect(updatedContent).toContain(`export * from './create-adaptive-styles';`);
    expect(updatedContent).toContain(`export * from './eva-theme';`);
  });

  it('should add dependencies globally', async () => {
    existsSyncMock.mockReturnValue(false);
    const options = { directory: 'myapp' };

    await runUIKittenGenerator(tree, options);

    expect(addDependenciesMock).toHaveBeenCalledWith(tree, expect.any(Object), {});
  });

  it('should add dependencies to app package.json if exists', async () => {
    existsSyncMock.mockReturnValue(true);
    const options = { directory: 'myapp' };
    const appPackagePath = 'apps/myapp/package.json';

    await runUIKittenGenerator(tree, options);

    expect(addDependenciesMock).toHaveBeenCalledWith(tree, expect.any(Object), {}, appPackagePath);
  });

  it('should call formatFiles', async () => {
    const options = { directory: 'myapp' };

    await runUIKittenGenerator(tree, options);

    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });
});
