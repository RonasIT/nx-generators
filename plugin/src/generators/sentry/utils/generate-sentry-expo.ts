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

const expoAppDependencies = {
  '@sentry/react-native': '~5.22.0',
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

const updateExtraConfig = (content: string, DSN: string): string =>
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
                  factory.createStringLiteral(DSN),
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

  const layoutContent = tree.read(`${projectRoot}/app/_layout.tsx`).toString();

  const updatedLayoutContent = removeExportsKeywordForRootLayout(
    addRequiredImportsExpo(layoutContent),
  );

  tree.write(
    `${projectRoot}/app/_layout.tsx`,
    `${updatedLayoutContent}
      const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

      Sentry.init({
        dsn: Constants.expoConfig?.extra?.sentry?.dsn,
        environment: Constants.expoConfig?.extra?.env,
        debug: false,
        integrations: [new Sentry.ReactNativeTracing({ routingInstrumentation })],
        enabled: !__DEV__
      });

      export default Sentry.wrap(RootLayout);`,
  );

  const appConfigContent = tree.read(`${projectRoot}/app.config.ts`).toString();

  const updatedAppConfigContent = updateExtraConfig(
    addSentryPluginToAppConfig(appConfigContent),
    options.DSN,
  );

  tree.write(`${projectRoot}/app.config.ts`, updatedAppConfigContent);
}
