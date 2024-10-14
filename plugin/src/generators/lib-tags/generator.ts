import { Tree, getProjects, ProjectConfiguration, formatFiles, output } from '@nx/devkit';
import { LibTagsGeneratorSchema } from './schema';
import { execSync } from 'child_process';
import { askQuestion, getNxRules, readESLintConfig, verifyEsLintConfig } from '../../shared/utils';
import { noop } from 'lodash';
import { checkApplicationTags, checkLibraryTags } from './utils';
import { LibTagsContext } from './interfaces';

const context: LibTagsContext = {
  config: {},
  rules: [],
  log: console.log,
  reload: (tree: Tree) => {
    context.config = readESLintConfig(tree).config;
    context.rules = getNxRules(context.config);
  }
};

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

  if (options.silent) {
    context.log = noop;
  }

  // #1 Check eslint config nx-boundaries rule
  output.log({ title: output.bold('1. Checking eslint config nx-boundaries rule...') });
  context.config = verifyEsLintConfig(tree);

  // #2 Check projects tags
  output.log({ title: output.bold('2. Checking projects tags...') });
  const projects = getProjects(tree);
  const applications: Array<ProjectConfiguration> = [];
  const libraries: Array<ProjectConfiguration> = [];

  context.rules = getNxRules(context.config);

  projects.forEach((project) => {
    if (project.projectType === 'application') {
      applications.push(project);
    }

    if (project.projectType === 'library' && project.root.startsWith('libs')) {
      libraries.push(project);
    }
  });

  applications.forEach((application) => checkApplicationTags(application, tree, context));

  context.reload(tree);

  libraries.forEach((library) => checkLibraryTags(library, tree, context));

  await formatFiles(tree);
}

export default libTagsGenerator;
