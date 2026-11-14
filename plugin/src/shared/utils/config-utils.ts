import * as path from 'path';
import { names, Tree, output, readJson, writeJson } from '@nx/devkit';
import { IndentationText, Project, QuoteKind, SyntaxKind } from 'ts-morph';

const constraintsConfigPath = 'eslint.constraints.json';
const eslintRonasitConfigPath = '.eslint.ronasit.cjs';

export const isOxlintWorkspace = (tree: Tree): boolean => tree.exists('oxlint.config.ts');

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
  const constraints = readConstraints(tree);
  const doesTagExist = !!constraints.find((constraint) => constraint.sourceTag === `app:${appDirectory}`);

  if (doesTagExist) {
    return;
  }

  constraints.push({
    sourceTag: `app:${appDirectory}`,
    onlyDependOnLibsWithTags: [`app:${appDirectory}`, 'app:shared'],
  });

  writeConstraints(tree, constraints);
};

export const addNxScopeTag = (tree: Tree, scope: string): void => {
  const constraints = readConstraints(tree);
  const doesTagExist = !!constraints.find((constraint) => constraint.sourceTag === `scope:${scope}`);

  if (doesTagExist) {
    return;
  }

  constraints.push({ sourceTag: `scope:${scope}`, onlyDependOnLibsWithTags: [`scope:${scope}`, 'scope:shared'] });

  writeConstraints(tree, constraints);
};

export const getImportPathPrefix = (tree: Tree): string => {
  const npmScope = getNpmScope(tree);

  return npmScope ? `${npmScope === '@' ? '' : '@'}${npmScope}` : '';
};

export const getWorkspaceScope = (tree: Tree, name?: string): string => {
  const root = tree.root || process.cwd();
  const base = name || path.basename(root) || path.basename(process.cwd());

  return names(base).fileName;
};

export const getRootPackageName = (scope: string): string => `@${scope}/source`;

export const defaultRootPackageName = getRootPackageName('org');

export const verifyConstraintsConfig = (tree: Tree): void => {
  const isOxlint = isOxlintWorkspace(tree);
  const linterName = isOxlint ? 'Oxlint' : 'ESLint';
  let constraints: Array<Constraint> = [];

  try {
    constraints = readConstraints(tree);
  } catch {
    output.warn({ title: output.bold(`${linterName} constraints config not found. Generating default rules...`) });

    constraints = require('../templates/config-template.json') as Array<Constraint>;

    writeConstraints(tree, constraints);

    if (isOxlint) {
      output.note({
        title: 'Configure Nx boundaries',
        bodyLines: [
          'In your Oxlint config, register @nx/oxlint/boundaries-plugin as a JavaScript plugin named @nx.',
          'Enable @nx/enforce-module-boundaries with depConstraints loaded from ./eslint.constraints.json.',
          'Refresh the project graph before linting: npx nx graph --file=.nx/project-graph.json',
        ],
      });
    } else {
      output.note({
        title: 'Configure Nx boundaries',
        bodyLines: [
          'To complete setup add the following changes in your ESLint config (eslint.config.cjs):',
          '```',
          output.bold(`const constraints = require('./eslint.constraints.json');`),
          '```',
          'module.exports = [',
          '```',
          `  {
          files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
          rules: {
            '@nx/enforce-module-boundaries': [
              'error',
              {
                enforceBuildableLibDependency: true,
                allow: [],
                depConstraints: ${output.bold('constraints')},
              },
            ],
          },
        },`,
          '```',
        ],
      });
    }
  }

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

    output.warn({ title: output.bold(`${linterName} constraints config is incorrect. Restoring default rules...`) });
  }
};

export const addEslintRulesOverride = (tree: Tree, appDirectory: string, rules: Record<string, unknown>): void => {
  if (isOxlintWorkspace(tree)) {
    return;
  }

  const content = tree.read(eslintRonasitConfigPath, 'utf-8');

  if (!content) {
    return;
  }

  const ruleLines = Object.entries(rules).map(
    ([name, value]) => `'${name}': ${JSON.stringify(value).replace(/"/g, "'")}`,
  );
  const override = `{
    files: ['apps/${appDirectory}/**/*.{ts,tsx}', 'libs/${appDirectory}/**/*.{ts,tsx}'],
    rules: { ${ruleLines.join(', ')} },
  }`;
  const normalize = (text: string): string => text.replace(/[\s,]/g, '');

  if (normalize(content).includes(normalize(override))) {
    return;
  }

  const project = new Project({
    useInMemoryFileSystem: true,
    manipulationSettings: { indentationText: IndentationText.TwoSpaces, quoteKind: QuoteKind.Single },
  });
  const file = project.createSourceFile('eslint.config.js', content);
  const configs = file
    .getDescendantsOfKind(SyntaxKind.BinaryExpression)
    .find((expression) => expression.getLeft().getText() === 'module.exports')
    ?.getRight()
    .asKind(SyntaxKind.ArrayLiteralExpression);

  configs?.addElement(override);

  tree.write(eslintRonasitConfigPath, file.getFullText());
};
