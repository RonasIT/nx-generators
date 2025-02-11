import { Tree, output, readJson, writeJson } from '@nx/devkit';

const constraintsConfigPath = 'eslint.constraints.json';

export interface Constraint {
  sourceTag: string;
  onlyDependOnLibsWithTags: Array<string>;
}

export const readConstraints = (tree: Tree): Array<Constraint> => {
  if (!tree.exists(constraintsConfigPath)) {
    throw new Error(`ESLint constraints config not found: ${constraintsConfigPath}`);
  }

  const config = readJson(tree, constraintsConfigPath);

  return config as Array<Constraint>;
};

export const writeConstraints = (tree: Tree, constraints: Array<Constraint>): void => {
  writeJson(tree, constraintsConfigPath, constraints);
};

const getNpmScope = (tree: Tree): string | undefined => {
  const { name } = tree.exists('package.json') ? readJson<{ name?: string }>(tree, 'package.json') : { name: null };

  return name?.startsWith('@') ? name.split('/')[0].substring(1) : undefined;
};

export const addNxAppTag = (tree: Tree, appDirectory: string): void => {
  // const { config, path } = readESLintConfig(tree);
  const constraints = readConstraints(tree);
  const doesTagExist = !!constraints.find((constraint) => constraint.sourceTag === `app:${appDirectory}`);

  if (doesTagExist) {
    return;
  }

  constraints.push({
    sourceTag: `app:${appDirectory}`,
    onlyDependOnLibsWithTags: [`app:${appDirectory}`, 'app:shared'],
  });

  // writeJson(tree, path, config);
  writeConstraints(tree, constraints);
};

export const addNxScopeTag = (tree: Tree, scope: string): void => {
  // const { config, path } = readESLintConfig(tree);
  const constraints = readConstraints(tree);
  const doesTagExist = !!constraints.find((constraint) => constraint.sourceTag === `scope:${scope}`);

  if (doesTagExist) {
    return;
  }

  constraints.push({ sourceTag: `scope:${scope}`, onlyDependOnLibsWithTags: [`scope:${scope}`, 'scope:shared'] });

  // writeJson(tree, path, config);
  writeConstraints(tree, constraints);
};

export const getImportPathPrefix = (tree: Tree): string => {
  const npmScope = getNpmScope(tree);

  return npmScope ? `${npmScope === '@' ? '' : '@'}${npmScope}` : '';
};

export const verifyEsLintConstraintsConfig = (tree: Tree): void => {
  const constraints = readConstraints(tree);
  const importantTags = [
    'app:shared',
    'scope:shared',
    'type:app',
    'type:data-access',
    'type:features',
    'type:ui',
    'type:utils',
  ];

  const tags = constraints.map((rule) => rule.sourceTag);
  const areRulesBroken = !importantTags.every((tag) => tags.includes(tag));

  if (areRulesBroken) {
    const defaultConstraints = require('../templates/config-template.json') as Array<Constraint>;

    writeConstraints(tree, defaultConstraints);

    output.warn({ title: output.bold('ESLint constraints config is incorrect. Restore default rules...') });
  }
};
