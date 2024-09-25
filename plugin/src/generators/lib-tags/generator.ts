import { readJson, Tree, writeJson, getProjects, ProjectConfiguration, formatFiles } from '@nx/devkit';
import { LibTagsGeneratorSchema } from './schema';
import { execSync } from 'child_process';
import { addNxAppTag, addNxScopeTag, askQuestion, getNxRules, getNxRulesEntry, readESLintConfig } from '../../shared/utils';
import { isEmpty } from 'lodash';

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

  // #1 Check eslint config nx-boundaries rule
  console.log('1. Checking eslint config nx-boundaries rule...\n');
  const { config, path } = readESLintConfig(tree);

  if (!config || isEmpty(config)) {
    throw new Error(`Failed to load ESLint config: ${path}`);
  }

  try {
    const rulesEntry = getNxRulesEntry(config).rules['@nx/enforce-module-boundaries'];

    if (rulesEntry[0] !== 'error') {
      rulesEntry[0] = 'error';
    }

    if (rulesEntry[1].depConstraints.find((rule) => rule.sourceTag === '*' && rule.onlyDependOnLibsWithTags.includes('*'))) {
      const esLintConfigTemplate = readJson(tree, 'plugin/src/generators/code-checks/files/.eslintrc.json.template');
      const templateRules = getNxRulesEntry(esLintConfigTemplate);
  
      rulesEntry[1] = templateRules.rules['@nx/enforce-module-boundaries'][1];

      writeJson(tree, path, config);
    }
    // TODO: use custom errors
  } catch {
    console.log('ESLint config has no @nx/enforce-module-boundaries rule. Updating rules...\n');

    const esLintConfigTemplate = readJson(tree, 'plugin/src/generators/code-checks/files/.eslintrc.json.template');
    const templateRules = getNxRulesEntry(esLintConfigTemplate);

    config.overrides.push(templateRules);

    writeJson(tree, path, config);
  }

  // #2 Check projects tags
  console.log('2. Checking projects tags...\n');
  const projects = getProjects(tree);
  const applications: Array<ProjectConfiguration> = [];
  const libraries: Array<ProjectConfiguration> = [];
  const rules = getNxRules(config);

  const checkApplicationTags = (project: ProjectConfiguration): void => {
    const { tags } = project;
    const appTag = tags.find((tag) => tag.startsWith('app:'));
    const hasTypeTag = tags.includes('type:app');

    if (appTag) {
      const appTagRule = rules.find((rule) => rule.sourceTag === appTag);

      if (!appTagRule) {
        console.log(`Missing app tag rule for ${appTag}. Adding...\n`);
        addNxAppTag(tree, appTag.replace('app:', ''));
      }
    } else {
      console.log(`Missing app tag for ${project.name}. Adding...`);

      const projectAppTag = project.root.split('/').pop();
      const projectJson = readJson(tree, `${project.root}/project.json`);

      projectJson.tags.push(`app:${projectAppTag}`);

      writeJson(tree, `${project.root}/project.json`, projectJson);
      addNxAppTag(tree,  projectAppTag);
    }

    if (!hasTypeTag) {
      console.log(`Missing type tag for ${project.name}. Adding...`);

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

    if (appTag) {
      const appTagRule = rules.find((rule) => rule.sourceTag === appTag);

      if (!appTagRule) {
        throw new Error(`Missing app tag rule for ${appTag}. Please add it to the ESLint config file.`);
      }
    } else {
      console.log(`Missing app tag for ${project.name}. Adding...`);

      const projectAppTag = project.root.split('/')[1];
      const projectJson = readJson(tree, `${project.root}/project.json`);

      projectJson.tags.push(`app:${projectAppTag}`);

      writeJson(tree, `${project.root}/project.json`, projectJson);
    }

    if (scopeTag) {
      const scopeTagRule = rules.find((rule) => rule.sourceTag === scopeTag);

      if (!scopeTagRule) {
        console.log(`Missing scope tag rule for ${scopeTag}. Adding...`);
        addNxScopeTag(tree, scopeTag.replace('scope:', ''));
      }
    } else {
      console.log(`Missing scope tag for ${project.name}. Adding...`);

      const projectAppTag = project.root.split('/')[1];
      const projectScopeTag = projectAppTag === 'shared' ? 'shared' : project.root.split('/')[2];
      const projectJson = readJson(tree, `${project.root}/project.json`);

      projectJson.tags.push(`scope:${projectScopeTag}`);

      writeJson(tree, `${project.root}/project.json`, projectJson);
      addNxScopeTag(tree,  projectScopeTag);
    }

    if (typeTag) {
      const typeTagRule = rules.find((rule) => rule.sourceTag === typeTag);

      if (!typeTagRule) {
        throw new Error(`Missing type tag rule for ${typeTag}. Please add it to the ESLint config file.`);
      }
    } else {
      console.log(`Missing type tag for ${project.name}. Adding...`);

      const projectAppTag = project.root.split('/')[1];
      const projectLibTypeTag = projectAppTag === 'shared' ? project.root.split('/')[2] : project.root.split('/')[3];
      const typeTagRule = rules.find((rule) => rule.sourceTag === `type:${projectLibTypeTag}`);

      if (!typeTagRule) {
        throw new Error(`Missing type tag rule for ${projectLibTypeTag}. Please add it to the ESLint config file.`);
      }

      const projectJson = readJson(tree, `${project.root}/project.json`);

      projectJson.tags.push(`type:${projectLibTypeTag}`);

      writeJson(tree, `${project.root}/project.json`, projectJson);
    }
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
  libraries.forEach(checkLibraryTags);

  await formatFiles(tree);
}

export default libTagsGenerator;
