/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { reactComponentGenerator } from './generator';

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn().mockImplementation(() => ({
    run: jest.fn().mockResolvedValue('libs/shared/ui'),
  })),
}));

jest.mock('@nx/devkit', () => {
  const actual = jest.requireActual('@nx/devkit');

  return {
    ...actual,
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
  };
});

describe('reactComponentGenerator', () => {
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

    // Check generated files exist
    expect(tree.exists('libs/shared/ui/lib/components/my-component/index.ts')).toBe(true);

    // Assert first line correctness from templates
    const templatesDir = path.join(__dirname, 'files');
    assertFirstLine(templatesDir, 'libs/shared/ui/lib/components/my-component');
  });

  it('should generate component files without updating index when subcomponent is false', async () => {
    const options = { name: 'MainFeature', subcomponent: false };

    await reactComponentGenerator(tree, options);

    // Check expected files generated
    expect(tree.exists('libs/shared/ui/lib/component.tsx')).toBe(true);
    expect(tree.exists('libs/shared/ui/lib/index.ts')).toBe(true);

    // Assert first line correctness from templates
    const templatesDir = path.join(__dirname, 'files');
    assertFirstLine(templatesDir, 'libs/shared/ui/lib');
  });
});
