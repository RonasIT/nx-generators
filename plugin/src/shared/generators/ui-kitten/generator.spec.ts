/// <reference types="jest" />
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { assertFirstLine, readJsonMock } from '../../tests-utils';
import { runUIKittenGenerator } from './generator';

describe('runUIKittenGenerator', () => {
  let tree: devkit.Tree;
  const appDirectory = 'myapp';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write(`libs/${appDirectory}/shared/ui/styles/src/lib/index.ts`, 'initial styles content\n');

    readJsonMock.mockImplementation((path) => {
      if (path === 'package.json') {
        return { name: `@org/${appDirectory}` };
      }

      return {};
    });

    jest.clearAllMocks();
  });

  it('should generate files and match first lines with templates', async () => {
    const options = { directory: appDirectory };

    await runUIKittenGenerator(tree, options);

    const templateDir = path.join(__dirname, 'lib-files');
    const targetDir = `libs/${appDirectory}`;

    assertFirstLine(templateDir, targetDir, tree, {
      placeholders: {
        libPath: `@proj/${appDirectory}`,
      },
    });
  });
});
