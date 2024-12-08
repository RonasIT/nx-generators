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
import { createObjectLiteralExpression } from './create-object-literal-expression';
import { SentryGeneratorSchema } from '../schema';
import { updateFile } from 'plugin/src/shared/utils';

const expoAppDependencies = {
  '@sentry/react-native': '~6.1.0',
};

const addRequiredImportsExpo = (content: string): string =>
  tsquery.replace(
    content,
    'ImportDeclaration:has(StringLiteral[value="expo-router"])',
    (node) =>
      `${node.getText()}
        import * as Sentry from "@sentry/react-native";
        import Constants from "expo-constants";`,
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
      (node: ObjectLiteralExpression) =>
        createObjectLiteralExpression(
          [
            {
              key: 'sentry',
              initializer: factory.createObjectLiteralExpression([
                factory.createPropertyAssignment(
                  'dsn',
                  factory.createStringLiteral(dsn),
                ),
              ]),
            },
          ],
          node.properties,
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
      (node: ArrayLiteralExpression) => {
        const objectLiteralExpression = factory.createObjectLiteralExpression([
          factory.createPropertyAssignment(
            'organization',
            factory.createStringLiteral(''),
          ),
          factory.createPropertyAssignment(
            'project',
            factory.createStringLiteral(''),
          ),
        ]);

        addSyntheticLeadingComment(
          objectLiteralExpression,
          SyntaxKind.SingleLineCommentTrivia,
          ' TODO Update organization and project name',
        );

        return factory.createArrayLiteralExpression([
          ...node.elements,
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
    () =>
      "const { getSentryExpoConfig } = require('@sentry/react-native/metro');",
  );

  return tsquery.replace(
    metroConfigContentWithImport,
    'VariableDeclaration CallExpression > Identifier[name="getDefaultConfig"]',
    () => 'getSentryExpoConfig',
  );
};

export function generateSentryExpo(
  tree: Tree,
  options: SentryGeneratorSchema,
  projectRoot: string,
) {
  const projectPackagePath = `${projectRoot}/package.json`;

  addDependenciesToPackageJson(tree, expoAppDependencies, {});
  addDependenciesToPackageJson(
    tree,
    expoAppDependencies,
    {},
    projectPackagePath,
  );

  updateFile(tree, `${projectRoot}/app/_layout.tsx`, (fileContent) => {
    const updatedLayoutContent = removeExportsKeywordForRootLayout(
      addRequiredImportsExpo(fileContent),
    );

    return `${updatedLayoutContent}
      const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

      Sentry.init({
        dsn: Constants.expoConfig?.extra?.sentry?.dsn,
        environment: Constants.expoConfig?.extra?.env,
        debug: false,
        integrations: [new Sentry.ReactNativeTracing({ routingInstrumentation })],
        enabled: !__DEV__
      });

      export default Sentry.wrap(RootLayout);`;
  });

  updateFile(tree, `${projectRoot}/app.config.ts`, (fileContent) =>
    updateExtraConfig(addSentryPluginToAppConfig(fileContent), options.dsn),
  );

  updateFile(tree, `${projectRoot}/metro.config.js`, (fileContent) =>
    updateMetroConfig(fileContent),
  );
}
