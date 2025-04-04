import { addDependenciesToPackageJson, Tree } from '@nx/devkit';
import { tsquery } from '@phenomnomnominal/tsquery';
import {
  createPrinter,
  factory,
  ObjectLiteralExpression,
  SyntaxKind,
  addSyntheticLeadingComment,
  ArrayLiteralExpression,
} from 'typescript';
import { dependencies } from '../../../shared/dependencies';
import { updateFileContent } from '../../../shared/utils';
import { SentryGeneratorSchema } from '../schema';
import { createObjectLiteralExpression } from './create-object-literal-expression';

const addRequiredImportsExpo = (content: string): string =>
  tsquery.replace(
    content,
    'ImportDeclaration:has(StringLiteral[value="expo-router"])',
    (node) =>
      `${node.getText()}
        import * as Sentry from "@sentry/react-native";
        import Constants from "expo-constants";
        import { isRunningInExpoGo } from 'expo';`,
  );

const removeExportsKeywordForRootLayout = (content: string): string =>
  tsquery.replace(
    content,
    'FunctionDeclaration:has(Identifier[name="RootLayout"]) > :matches(ExportKeyword, DefaultKeyword)',
    () => '',
    {
      visitAllChildren: true,
    },
  );

const updateExtraConfig = (content: string, dsn: string): string =>
  createPrinter().printFile(
    tsquery.map(
      tsquery.ast(content),
      'VariableDeclaration > Identifier[name="extra"] ~ ObjectLiteralExpression',
      (node) =>
        createObjectLiteralExpression(
          [
            {
              key: 'sentry',
              initializer: factory.createObjectLiteralExpression([
                factory.createPropertyAssignment('dsn', factory.createStringLiteral(dsn)),
              ]),
            },
          ],
          (node as ObjectLiteralExpression).properties,
        ),
      {
        visitAllChildren: true,
      },
    ),
  );

const addSentryPluginToAppConfig = (content: string): string =>
  createPrinter().printFile(
    tsquery.map(
      tsquery.ast(content),
      'VariableDeclaration:has(Identifier[name="createConfig"]) ReturnStatement PropertyAssignment:has(Identifier[name="plugins"]) > ArrayLiteralExpression',
      (node) => {
        const objectLiteralExpression = factory.createObjectLiteralExpression([
          factory.createPropertyAssignment('organization', factory.createStringLiteral('')),
          factory.createPropertyAssignment('project', factory.createStringLiteral('')),
        ]);

        addSyntheticLeadingComment(
          objectLiteralExpression,
          SyntaxKind.SingleLineCommentTrivia,
          ' TODO Update organization and project name',
        );

        return factory.createArrayLiteralExpression([
          ...(node as ArrayLiteralExpression).elements,
          factory.createArrayLiteralExpression([
            factory.createStringLiteral('@sentry/react-native/expo'),
            objectLiteralExpression,
          ]),
        ]);
      },
    ),
  );

const updateMetroConfig = (content: string): string => {
  const metroConfigContentWithImport = tsquery.replace(
    content,
    'VariableStatement:has(Identifier[name="getDefaultConfig"]):has(CallExpression:has(Identifier[name="require"]))',
    () => `const { getSentryExpoConfig } = require('@sentry/react-native/metro');`,
  );

  return tsquery.replace(
    metroConfigContentWithImport,
    'VariableDeclaration CallExpression > Identifier[name="getDefaultConfig"]',
    () => 'getSentryExpoConfig',
  );
};

export function generateSentryExpo(tree: Tree, options: SentryGeneratorSchema, projectRoot: string): void {
  const projectPackagePath = `${projectRoot}/package.json`;

  addDependenciesToPackageJson(tree, dependencies.sentry.expo, {});
  addDependenciesToPackageJson(tree, dependencies.sentry.expo, {}, projectPackagePath);

  updateFileContent(
    `${projectRoot}/app/_layout.tsx`,
    (fileContent) => {
      const updatedLayoutContent = removeExportsKeywordForRootLayout(addRequiredImportsExpo(fileContent));

      return `${updatedLayoutContent}
      const navigationIntegration = Sentry.reactNavigationIntegration({
        enableTimeToInitialDisplay: !isRunningInExpoGo(),
      });

      Sentry.init({
        dsn: Constants.expoConfig?.extra?.sentry?.dsn,
        environment: Constants.expoConfig?.extra?.env,
        debug: false,
        integrations: [navigationIntegration],
        enableNativeFramesTracking: !isRunningInExpoGo(), // Tracks slow and frozen frames in the application
        enabled: !__DEV__
      });

      export default Sentry.wrap(RootLayout);`;
    },
    tree,
  );

  updateFileContent(
    `${projectRoot}/app.config.ts`,
    (fileContent) => updateExtraConfig(addSentryPluginToAppConfig(fileContent), options.dsn),
    tree,
  );

  updateFileContent(`${projectRoot}/metro.config.js`, (fileContent) => updateMetroConfig(fileContent), tree);
}
