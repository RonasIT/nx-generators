import { Tree, readJson, writeJson } from '@nx/devkit';

const defaultEsLintConfigPath = '.eslintrc.base.json';

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
    throw new Error(`ESLint: can't find '@nx/enforce-module-boundaries' rule in ${defaultEsLintConfigPath}`);
  }

  return entryWithRules.rules['@nx/enforce-module-boundaries'][1].depConstraints;
};

const readESLintConfig = (tree: Tree): { config: Record<string, any>, path: string } => {
  let path = defaultEsLintConfigPath;

  const checkConfigExists = (path: string): void => {
    if (!tree.exists(path)) {
      throw new Error(`ESLint config not found: ${path}`);
    }
  };

  checkConfigExists(path);

  let config = readJson(tree, path);

  if (config.extends?.length) {
    path = config.extends[0];

    checkConfigExists(path);

    config = readJson(tree, config.extends[0]);
  }

  return { config, path };
};

const getNpmScope = (tree: Tree): string | undefined => {
  const { name } = tree.exists('package.json')
    ? readJson<{ name?: string }>(tree, 'package.json')
    : { name: null };

  return name?.startsWith('@') ? name.split('/')[0].substring(1) : undefined;
};

export const addNxAppTag = (tree: Tree, appDirectory: string): void => {
  const { config, path } = readESLintConfig(tree);
  const constraints = getNxRules(config);

  constraints.push({ sourceTag: `app:${appDirectory}`, onlyDependOnLibsWithTags: [`app:${appDirectory}`, 'app:shared'] });

  writeJson(tree, path, config);
};

export const addNxScopeTag = (tree: Tree, scope: string): void => {
  const { config, path } = readESLintConfig(tree);
  const constraints = getNxRules(config);
  const isTagExists = !!constraints.find((constraint) => constraint.sourceTag === `scope:${scope}`);

  if (isTagExists) {
    return;
  }

  constraints.push({ sourceTag: `scope:${scope}`, onlyDependOnLibsWithTags: [`scope:${scope}`, 'scope:shared'] });

  writeJson(tree, path, config);
};

export const getImportPathPrefix = (tree: Tree): string => {
  const npmScope = getNpmScope(tree);

  return npmScope ? `${npmScope === '@' ? '' : '@'}${npmScope}` : '';
};
