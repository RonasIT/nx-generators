/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { reactComponentGenerator } from './generator';

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn().mockImplementation(() => ({
    run: jest.fn().mockResolvedValue('libs/shared/ui'),
  })),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn((tree, src, dest) => {
    function copyRecursive(srcDir: string, destDir: string): void {
      const entries = fs.readdirSync(srcDir, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);

        if (entry.isDirectory()) {
          copyRecursive(srcPath, path.join(destDir, entry.name));
        } else {
          const filename = entry.name.replace(/\.template$/, '');
          const destPath = path.join(destDir, filename).split(path.sep).join('/');
          const content = fs.readFileSync(srcPath, 'utf8');
          tree.write(destPath, content);
        }
      }
    }
    copyRecursive(src, dest.split(path.sep).join('/'));
  }),
  formatFiles: jest.fn(),
}));

jest.mock('../../shared/utils', () => ({
  formatName: jest.fn((name: string, capitalize: boolean) =>
    capitalize ? name.charAt(0).toUpperCase() + name.slice(1) : name,
  ),
  getNxLibsPaths: jest.fn(() => ['libs/shared/ui']),
  appendFileContent: jest.fn(),
  LibraryType: {
    FEATURES: 'features',
    UI: 'ui',
  },
}));

const filesPathMatcher = expect.stringMatching(/react-component[/\\]files$/);

describe('reactComponentGenerator', () => {
  const generateFilesMock = devkit.generateFiles as jest.Mock;
  const formatFilesMock = devkit.formatFiles as jest.Mock;
  const appendFileContentMock = require('../../shared/utils').appendFileContent as jest.Mock;

  let tree: ReturnType<typeof createTreeWithEmptyWorkspace>;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.clearAllMocks();
  });

  function assertFirstLine(sourceDir: string, targetDir: string): void {
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(sourceDir, entry.name);

      if (entry.isDirectory()) {
        assertFirstLine(srcPath, path.join(targetDir, entry.name));
      } else {
        const targetFile = path
          .join(targetDir, entry.name.replace(/\.template$/, ''))
          .split(path.sep)
          .join('/');
        const expectedFirstLine = fs.readFileSync(srcPath, 'utf8').split('\n')[0].trim();
        const generatedContent = tree.read(targetFile)?.toString();

        if (!generatedContent) {
          throw new Error(`Expected file not found in virtual tree: ${targetFile}`);
        }
        const actualFirstLine = generatedContent.split('\n')[0].trim();
        expect(actualFirstLine).toBe(expectedFirstLine);
      }
    }
  }

  it('should generate component files and update component index when subcomponent = true', async () => {
    const options = { name: 'MyComponent', subcomponent: true };

    await reactComponentGenerator(tree, options);

    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      filesPathMatcher,
      'libs/shared/ui/lib/components/my-component',
      expect.objectContaining({ name: 'MyComponent' }),
    );

    expect(appendFileContentMock).toHaveBeenCalledWith(
      'libs/shared/ui/index.ts',
      expect.stringContaining(`export * from './lib';`),
      tree,
    );

    expect(appendFileContentMock).toHaveBeenCalledWith(
      'libs/shared/ui/lib/index.ts',
      expect.stringContaining(`export * from './components';`),
      tree,
    );

    expect(tree.exists('libs/shared/ui/lib/components/index.ts')).toBe(true);
    const contents = tree.read('libs/shared/ui/lib/components/index.ts', 'utf-8');
    expect(contents).toContain(`export * from './my-component';`);

    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });

  it('should only generate files and call formatFiles when subcomponent = false', async () => {
    const options = { name: 'MainFeature', subcomponent: false };

    await reactComponentGenerator(tree, options);

    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      filesPathMatcher,
      'libs/shared/ui/lib',
      expect.objectContaining({ name: 'MainFeature' }),
    );

    expect(appendFileContentMock).not.toHaveBeenCalled();
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });

  it('should generate component files and update component index when subcomponent = true', async () => {
    const options = { name: 'MyComponent', subcomponent: true };

    await reactComponentGenerator(tree, options);

    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      filesPathMatcher,
      'libs/shared/ui/lib/components/my-component',
      expect.objectContaining({ name: 'MyComponent' }),
    );

    expect(appendFileContentMock).toHaveBeenCalledWith(
      'libs/shared/ui/index.ts',
      expect.stringContaining(`export * from './lib';`),
      tree,
    );

    expect(appendFileContentMock).toHaveBeenCalledWith(
      'libs/shared/ui/lib/index.ts',
      expect.stringContaining(`export * from './components';`),
      tree,
    );

    expect(tree.exists('libs/shared/ui/lib/components/index.ts')).toBe(true);
    const contents = tree.read('libs/shared/ui/lib/components/index.ts', 'utf-8');
    expect(contents).toContain(`export * from './my-component';`);

    // Assert file content first lines from templates
    const templatesDir = path.join(__dirname, 'files');
    assertFirstLine(templatesDir, 'libs/shared/ui/lib/components/my-component');

    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });

  it('should only generate files and call formatFiles when subcomponent = false', async () => {
    const options = { name: 'MainFeature', subcomponent: false };

    await reactComponentGenerator(tree, options);

    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      filesPathMatcher,
      'libs/shared/ui/lib',
      expect.objectContaining({ name: 'MainFeature' }),
    );

    expect(appendFileContentMock).not.toHaveBeenCalled();

    // Assert file content first lines from templates
    const templatesDir = path.join(__dirname, 'files');
    assertFirstLine(templatesDir, 'libs/shared/ui/lib');

    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });
});
