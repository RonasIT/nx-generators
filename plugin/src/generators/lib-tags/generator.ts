import { readJson, Tree, writeJson, getProjects } from '@nx/devkit';
import { LibTagsGeneratorSchema } from './schema';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { addNxAppTag, askQuestion, formatName } from '../../shared/utils';
import * as path from 'path';

export async function libTagsGenerator(
  tree: Tree,
  options: LibTagsGeneratorSchema,
) {
  const hasUnstagedChanges = execSync('git status -s').toString('utf8');

  if (hasUnstagedChanges) {
    const shouldContinue = await askQuestion('You have unstaged changes. Are you sure you want to continue? (y/n): ') === 'y';

    if (!shouldContinue) {
      return;
    }
  }

  const projects = getProjects(tree);
  console.log(projects);
}

export default libTagsGenerator;
