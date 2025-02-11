import { ProjectConfiguration, Tree, readProjectConfiguration, updateProjectConfiguration } from '@nx/devkit';
import { addNxAppTag, addNxScopeTag, constants, readConstraints } from '../../../shared/utils';
import { LibTagsContext, VerifyTagConfig } from '../interfaces';
import { TagType } from '../types';

const getTagFromLibPath = (libPath: string, type: TagType): string => {
  const projectAppTag = libPath.split('/')[1];

  switch (type) {
    case 'app':
      return projectAppTag;
    case 'scope':
      return projectAppTag === constants.sharedValue ? constants.sharedValue : libPath.split('/')[2];
    case 'type':
      return projectAppTag === constants.sharedValue ? libPath.split('/')[2] : libPath.split('/')[3];
  }
};

const verifyLibraryTag = ({ project, tree, tag, tagType, context, ruleNotFoundCallback }: VerifyTagConfig): void => {
  const defaultRuleNotFoundCallback = (): void => {
    throw new Error(`Missing ${tagType} tag rule for ${tag}. Please add it to the ESLint config file.`);
  };

  if (tag) {
    const tagRule = readConstraints(tree).find((rule) => rule.sourceTag === tag);

    if (!tagRule) {
      const callback = ruleNotFoundCallback || defaultRuleNotFoundCallback;

      callback();
    }

    const tagFromLibPath = getTagFromLibPath(project.root, tagType);
    const isInvalidTag = tag !== `${tagType}:${tagFromLibPath}`;

    if (isInvalidTag) {
      context.log(`Invalid tag ${tag}. Updating...\n`);

      project = readProjectConfiguration(tree, project.name as string);

      const filteredTags = project.tags?.filter((item) => item !== tag) || [];

      project.tags = [...filteredTags, `${tagType}:${tagFromLibPath}`];

      updateProjectConfiguration(tree, project.name as string, project);

      if (tagType === 'scope') {
        addNxScopeTag(tree, tagFromLibPath);
      }

      verifyLibraryTag({
        project,
        tree,
        tag: `${tagType}:${tagFromLibPath}`,
        tagType,
        context,
      });
    }
  } else {
    context.log(`Missing ${tagType} tag for ${project.name}. Adding...`);

    project = readProjectConfiguration(tree, project.name as string);

    const tag = getTagFromLibPath(project.root, tagType);

    if (tagType === 'type') {
      const typeTagRule = readConstraints(tree).find((rule) => rule.sourceTag === `type:${tag}`);

      if (!typeTagRule) {
        throw new Error(`Missing type tag rule for ${tag}. Please add it to the ESLint constraints config file.`);
      }
    }

    updateProjectConfiguration(tree, project.name as string, {
      ...project,
      tags: [...(project.tags || []), `${tagType}:${tag}`],
    });

    if (tagType === 'scope') {
      addNxScopeTag(tree, tag);
    }
  }
};

export const checkApplicationTags = (project: ProjectConfiguration, tree: Tree, context: LibTagsContext): void => {
  const { tags } = project;
  const appTag = tags?.find((tag) => tag.startsWith('app:'));
  const hasTypeTag = tags?.includes('type:app');

  if (appTag) {
    // const appTagRule = context.rules.find((rule) => rule.sourceTag === appTag);
    const appTagRule = readConstraints(tree).find((rule) => rule.sourceTag === appTag);

    if (!appTagRule) {
      context.log(`Missing app tag rule for ${appTag}. Adding...\n`);
      addNxAppTag(tree, appTag.replace('app:', ''));
    }
  } else {
    context.log(`Missing app tag for ${project.name}. Adding...`);

    const projectAppTag = project.root.split('/').pop() as string;

    updateProjectConfiguration(tree, project.name as string, {
      ...project,
      tags: [...(project.tags || []), `app:${projectAppTag}`],
    });
    addNxAppTag(tree, projectAppTag);
  }

  if (!hasTypeTag) {
    context.log(`Missing type tag for ${project.name}. Adding...`);

    project = readProjectConfiguration(tree, project.name as string);

    updateProjectConfiguration(tree, project.name as string, {
      ...project,
      tags: [...(project.tags || []), 'type:app'],
    });
  }
};

export const checkLibraryTags = (project: ProjectConfiguration, tree: Tree, context: LibTagsContext): void => {
  const { tags } = project;
  const appTag = tags?.find((tag) => tag.startsWith('app:'));
  const scopeTag = tags?.find((tag) => tag.startsWith('scope:'));
  const typeTag = tags?.find((tag) => tag.startsWith('type:'));

  verifyLibraryTag({ project, tree, tag: appTag, tagType: 'app', context });
  verifyLibraryTag({
    project,
    tree,
    tag: scopeTag,
    tagType: 'scope',
    context,
    ruleNotFoundCallback: () => {
      context.log(`Missing scope tag rule for ${scopeTag}. Adding...`);
      addNxScopeTag(tree, scopeTag?.replace('scope:', '') as string);
    },
  });
  verifyLibraryTag({ project, tree, tag: typeTag, tagType: 'type', context });
};
