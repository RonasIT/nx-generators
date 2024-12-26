import { ProjectConfiguration, Tree } from '@nx/devkit';
import { TagType } from '../types';
import { LibTagsContext } from './context';

export interface VerifyTagConfig {
  project: ProjectConfiguration,
  tree: Tree,
  tag?: string,
  tagType: TagType,
  context: LibTagsContext,
  ruleNotFoundCallback?: () => void
}
