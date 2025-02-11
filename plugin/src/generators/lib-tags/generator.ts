import { execSync } from 'child_process';
import { Tree, getProjects, ProjectConfiguration, formatFiles, output } from '@nx/devkit';
import { noop } from 'lodash';
import { askQuestion, verifyEsLintConstraintsConfig } from '../../shared/utils';
import { LibTagsContext } from './interfaces';
import { LibTagsGeneratorSchema } from './schema';
import { checkApplicationTags, checkLibraryTags } from './utils';

const context: LibTagsContext = {
  log: console.log
};

export async function libTagsGenerator(tree: Tree, options: LibTagsGeneratorSchema): Promise<void> {
  const hasUnstagedChanges = !options.skipRepoCheck && execSync('git status -s').toString('utf8');

  if (hasUnstagedChanges) {
    const shouldContinue =
      (await askQuestion('You have unstaged changes. Are you sure you want to continue? (y/n): ')) === 'y';

    if (!shouldContinue) {
      return;
    }
  }

  if (options.silent) {
    context.log = noop;
  }

  // #1 Check eslint config nx-boundaries rule
  output.log({ title: output.bold('1. Checking eslint config nx-boundaries rule...') });
  verifyEsLintConstraintsConfig(tree);

  // #2 Check project tags
  output.log({ title: output.bold('Checking projects tags...') });

  const projects = getProjects(tree);
  const applications: Array<ProjectConfiguration> = [];
  const libraries: Array<ProjectConfiguration> = [];

  projects.forEach((project) => {
    if (project.projectType === 'application') {
      applications.push(project);
    }

    if (project.projectType === 'library' && project.root.startsWith('libs')) {
      libraries.push(project);
    }
  });

  applications.forEach((application) => checkApplicationTags(application, tree, context));
  libraries.forEach((library) => checkLibraryTags(library, tree, context));

  await formatFiles(tree);
}

export default libTagsGenerator;
