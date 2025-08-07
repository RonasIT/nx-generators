/// <reference types="jest" />
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { assertFirstLine, execSyncMock, formatFilesMock } from '../../tests-utils';
import { runFormUtilsGenerator } from './generator';

describe('runFormUtilsGenerator', () => {
  let tree: devkit.Tree;

  const templatesDir = path.join(__dirname, 'lib-files');
  const targetDir = 'libs/myapp';
  const indexFilePath = 'libs/myapp/shared/utils/form/src/index.ts';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Create dummy index.ts file that will be deleted by generator
    tree.write(indexFilePath, 'export {};');

    jest.clearAllMocks();
  });

  it('should run the form utils generator and update files correctly', async () => {
    const options = {
      directory: 'myapp',
    };

    await runFormUtilsGenerator(tree, options);

    // Verify execSync called with correct nx generate command
    expect(execSyncMock).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${options.directory} --scope=shared --type=utils --name=form`,
      { stdio: 'inherit' },
    );

    expect(formatFilesMock).toHaveBeenCalledWith(tree);

    assertFirstLine(templatesDir, targetDir, tree);
  });
});
