/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import generator from './generator';

describe('dockerfile generator (integration)', () => {
  let tree: Tree;
  const templateDir = path.join(__dirname, 'files');
  const dummyDockerfileText = 'FROM scratch';
  const existingGitignoreText = 'node_modules\n';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Add dummy Dockerfile to simulate overwrite scenario
    tree.write('Dockerfile', dummyDockerfileText);
    // Simulate existing .gitignore
    tree.write('.gitignore', existingGitignoreText);
  });

  it('should delete existing Dockerfile and generate new Dockerfile from template', async () => {
    // Load template content manually for comparison
    const dockerfileTemplate = fs.readFileSync(path.join(templateDir, 'Dockerfile.template'), 'utf-8');

    const callback = await generator(tree);

    // File was deleted
    expect(tree.read('Dockerfile')?.toString()).not.toContain(dummyDockerfileText);

    // Generated content matches template
    expect(tree.read('Dockerfile')?.toString()).toBe(dockerfileTemplate);

    // Other expected files from template dir
    const expectedFiles = fs.readdirSync(templateDir).map((f) => f.replace('.template', ''));

    for (const file of expectedFiles) {
      expect(tree.exists(file)).toBe(true);
    }

    // Gitignore should not be cleared
    expect(tree.read('.gitignore')?.toString()).toContain(existingGitignoreText);

    // Install callback
    expect(typeof callback).toBe('function');
  });

  it('should work when no existing Dockerfile is present', async () => {
    tree.delete('Dockerfile');

    const callback = await generator(tree);

    expect(tree.exists('Dockerfile')).toBe(true);
    expect(typeof callback).toBe('function');
  });
});
