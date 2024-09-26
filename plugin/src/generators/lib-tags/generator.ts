import { readJson, Tree, writeJson, getProjects, ProjectConfiguration, formatFiles } from '@nx/devkit';
import { LibTagsGeneratorSchema } from './schema';
import { execSync } from 'child_process';
import { addNxAppTag, addNxScopeTag, askQuestion, getNxRules, readESLintConfig, verifyEsLintConfig } from '../../shared/utils';

type TagType = 'app' | 'scope' | 'type';

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

  const log = (message: string): void => {
    if (!options.silent) {
      console.log(message);
    }
  };

  // #1 Check eslint config nx-boundaries rule
  log('1. Checking eslint config nx-boundaries rule...\n');
  let config = verifyEsLintConfig(tree);

  // #2 Check projects tags
  log('2. Checking projects tags...\n');
  const projects = getProjects(tree);
  const applications: Array<ProjectConfiguration> = [];
  const libraries: Array<ProjectConfiguration> = [];
  let rules = getNxRules(config);

  const getTagFromLibPath = (libPath: string, type: TagType): string => {
    const projectAppTag = libPath.split('/')[1];

    switch (type) {
      case 'app':
        return projectAppTag;
      case 'scope':
        return projectAppTag === 'shared' ? 'shared' : libPath.split('/')[2];
      case 'type':
        return projectAppTag === 'shared' ? libPath.split('/')[2] : libPath.split('/')[3];
    }
  };

  const verifyLibraryTag = (project: ProjectConfiguration, tag: string, type: TagType, ruleNotFoundCallback?: () => void): void => {
    const defaultRuleNotFoundCallback = (): void => {
      throw new Error(`Missing ${type} tag rule for ${tag}. Please add it to the ESLint config file.`);
    };

    if (tag) {
      const tagRule = rules.find((rule) => rule.sourceTag === tag);

      if (!tagRule) {
        const callback = ruleNotFoundCallback || defaultRuleNotFoundCallback;

        callback();
      }
    } else {
      log(`Missing ${type} tag for ${project.name}. Adding...`);

      const tag = getTagFromLibPath(project.root, type);

      if (type === 'type') {
        const typeTagRule = rules.find((rule) => rule.sourceTag === `type:${tag}`);

        if (!typeTagRule) {
          throw new Error(`Missing type tag rule for ${tag}. Please add it to the ESLint config file.`);
        }
      }

      const projectJson = readJson(tree, `${project.root}/project.json`);

      projectJson.tags.push(`${type}:${tag}`);

      writeJson(tree, `${project.root}/project.json`, projectJson);

      if (type === 'scope') {
        addNxScopeTag(tree,  tag);
      }
    }
  };

  const checkApplicationTags = (project: ProjectConfiguration): void => {
    const { tags } = project;
    const appTag = tags.find((tag) => tag.startsWith('app:'));
    const hasTypeTag = tags.includes('type:app');

    if (appTag) {
      const appTagRule = rules.find((rule) => rule.sourceTag === appTag);

      if (!appTagRule) {
        log(`Missing app tag rule for ${appTag}. Adding...\n`);
        addNxAppTag(tree, appTag.replace('app:', ''));
      }
    } else {
      log(`Missing app tag for ${project.name}. Adding...`);

      const projectAppTag = project.root.split('/').pop();
      const projectJson = readJson(tree, `${project.root}/project.json`);

      projectJson.tags.push(`app:${projectAppTag}`);

      writeJson(tree, `${project.root}/project.json`, projectJson);
      addNxAppTag(tree,  projectAppTag);
    }

    if (!hasTypeTag) {
      log(`Missing type tag for ${project.name}. Adding...`);

      const projectJson = readJson(tree, `${project.root}/project.json`);

      projectJson.tags.push('type:app');

      writeJson(tree, `${project.root}/project.json`, projectJson);
    }
  };

  const checkLibraryTags = (project: ProjectConfiguration): void => {
    const { tags } = project;
    const appTag = tags.find((tag) => tag.startsWith('app:'));
    const scopeTag = tags.find((tag) => tag.startsWith('scope:'));
    const typeTag = tags.find((tag) => tag.startsWith('type:'));

    verifyLibraryTag(project, appTag, 'app');
    verifyLibraryTag(project, scopeTag, 'scope', () => {
      log(`Missing scope tag rule for ${scopeTag}. Adding...`);
      addNxScopeTag(tree, scopeTag.replace('scope:', ''));
    });
    verifyLibraryTag(project, typeTag, 'type');
  };

  projects.forEach((project) => {
    if (project.projectType === 'application') {
      applications.push(project);
    }

    if (project.projectType === 'library' && project.root.startsWith('libs')) {
      libraries.push(project);
    }
  });

  applications.forEach(checkApplicationTags);

  config = readESLintConfig(tree).config;
  rules = getNxRules(config);

  libraries.forEach(checkLibraryTags);

  await formatFiles(tree);
}

export default libTagsGenerator;
