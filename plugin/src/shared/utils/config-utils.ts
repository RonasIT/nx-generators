import { Tree, readJson, writeJson } from '@nx/devkit';
import { isEmpty } from 'lodash';

const defaultEsLintConfigPath = '.eslintrc.json';

interface Constraint {
  sourceTag: string;
  onlyDependOnLibsWithTags: Array<string>;
}

export const getNxRulesEntry = (config: Record<string, any>): { files: Array<string>, rules: Record<string, any> } => {
  if (!config) {
    throw new Error('ESLint config not found');
  }

  const entryWithRules = config.overrides?.find((entry) => !!entry.rules['@nx/enforce-module-boundaries']);

  if (!entryWithRules) {
    throw new Error(`ESLint: can't find '@nx/enforce-module-boundaries' rule`);
  }

  return entryWithRules;
}

export const getNxRulesStatus = (config: Record<string, any>): string => {
  return getNxRulesEntry(config).rules['@nx/enforce-module-boundaries'][0];
}

export const getNxRules = (config: Record<string, any>): Array<Constraint> => {
  return getNxRulesEntry(config).rules['@nx/enforce-module-boundaries'][1].depConstraints;
};

export const readESLintConfig = (tree: Tree): { config: Record<string, any>, path: string } => {
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
  const doesTagExist = !!constraints.find((constraint) => constraint.sourceTag === `app:${appDirectory}`);

  if (doesTagExist) {
    return;
  }

  constraints.push({ sourceTag: `app:${appDirectory}`, onlyDependOnLibsWithTags: [`app:${appDirectory}`, 'app:shared'] });

  writeJson(tree, path, config);
};

export const addNxScopeTag = (tree: Tree, scope: string): void => {
  const { config, path } = readESLintConfig(tree);
  const constraints = getNxRules(config);
  const doesTagExist = !!constraints.find((constraint) => constraint.sourceTag === `scope:${scope}`);

  if (doesTagExist) {
    return;
  }

  constraints.push({ sourceTag: `scope:${scope}`, onlyDependOnLibsWithTags: [`scope:${scope}`, 'scope:shared'] });

  writeJson(tree, path, config);
};

export const getImportPathPrefix = (tree: Tree): string => {
  const npmScope = getNpmScope(tree);

  return npmScope ? `${npmScope === '@' ? '' : '@'}${npmScope}` : '';
};

export const verifyEsLintConfig = (tree: Tree): Record<string, any> => {
  const { config, path } = readESLintConfig(tree);
  const importantTags = ['app:shared', 'scope:shared', 'type:app', 'type:data-access', 'type:features', 'type:ui', 'type:utils'];

  if (!config || isEmpty(config)) {
    throw new Error(`Failed to load ESLint config: ${path}`);
  }

  try {
    const rulesEntry = getNxRulesEntry(config).rules['@nx/enforce-module-boundaries'];
    const tags = rulesEntry[1].depConstraints.map((rule) => rule.sourceTag);
    const areRulesDisabled = rulesEntry[1].depConstraints.find((rule) => rule.sourceTag === '*' && rule.onlyDependOnLibsWithTags.includes('*'));
    const areRulesBroken = !importantTags.every((tag) => tags.includes(tag));

    if (rulesEntry[0] !== 'error') {
      rulesEntry[0] = 'error';
    }

    if (areRulesDisabled || areRulesBroken) {
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

  return config;
};
