/// <reference types="jest" />
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { assertFirstLine, mockGenerateFiles } from '../../utils';
import { runUIKittenGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn((tree, src, dest, vars) => {
    mockGenerateFiles(tree, src, dest, vars);
  }),
  formatFiles: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  readJson: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.requireActual('fs').readdirSync,
  readFileSync: jest.requireActual('fs').readFileSync,
}));

const readJsonMock = devkit.readJson as jest.Mock;

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
        libPath: `/${appDirectory}`,
      },
    });
  });
});
