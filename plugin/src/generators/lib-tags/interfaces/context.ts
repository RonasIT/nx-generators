import { Tree } from '@nx/devkit';
import { Constraint } from '../../../shared/utils';

export interface LibTagsContext {
  config: Record<string, any>;
  rules: Array<Constraint>;
  log: (message: any, ...optionalParams: Array<any>) => void;
  reload: (tree: Tree) => void;
}
