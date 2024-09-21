import { Tree, readJson, writeJson } from '@nx/devkit';

const esLintConfigPath = '.eslintrc.json';

interface Constraint {
  sourceTag: string;
  onlyDependOnLibsWithTags: Array<string>;
}

const getNxRules = (config: Record<string, any>): Array<Constraint> => {
  if (!config) {
    throw new Error('ESLint config not found');
  }

  const entryWithRules = config.overrides?.find((entry) => !!entry.rules['@nx/enforce-module-boundaries']);

  if (!entryWithRules) {
    throw new Error(`ESLint: can't find '@nx/enforce-module-boundaries' rule in ${esLintConfigPath}`);
  }

  return entryWithRules.rules['@nx/enforce-module-boundaries'][1].depConstraints;
};

const readESLintConfig = (tree: Tree): Record<string, any> => {
  return tree.exists(esLintConfigPath) && readJson(tree, esLintConfigPath);
};

export const addNxAppTag = (tree: Tree, appDirectory: string): void => {
  const config = readESLintConfig(tree);
  const constraints = getNxRules(config);

  constraints.push({ sourceTag: `app:${appDirectory}`, onlyDependOnLibsWithTags: [`app:${appDirectory}`, 'app:shared'] });

  writeJson(tree, esLintConfigPath, config);
};

export const addNxScopeTag = (tree: Tree, scope: string): void => {
  const config = readESLintConfig(tree);
  const constraints = getNxRules(config);
  const isTagExists = !!constraints.find((constraint) => constraint.sourceTag === `scope:${scope}`);

  if (isTagExists) {
    return;
  }

  constraints.push({ sourceTag: `scope:${scope}`, onlyDependOnLibsWithTags: [`scope:${scope}`, 'scope:shared'] });

  writeJson(tree, esLintConfigPath, config);
};
