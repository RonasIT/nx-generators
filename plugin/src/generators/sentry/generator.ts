import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { SentryGeneratorSchema } from './schema';
import { Technology } from './enums';

const webDependencies = {
  '@sentry/nextjs': '^8.21.0',
};

const mobileDependencies = {
  '@sentry/react-native': '~5.22.0',
};

export async function sentryGenerator(
  tree: Tree,
  options: SentryGeneratorSchema,
) {
  const projectRoot = `apps/${options.directory}`;

  if (options.technology === Technology.NEXT_JS) {
    addDependenciesToPackageJson(tree, webDependencies, {});

    const nextConfigContent = tree
      .read(`apps/${options.directory}/next.config.js`)
      .toString()
      .replace(
        /^const { withNx } = require\('@nrwl\/next\/plugins\/with-nx'\);$/gm,
        `const { withSentryConfig } = require("@sentry/nextjs");
         const { withNx } = require('@nrwl/next/plugins/with-nx');`,
      )
      .replace(
        /^const nextConfig = {/gm,
        `const nextConfig = {
          sentry: {
            // Upload a larger set of source maps for prettier stack traces (increases build time)
            widenClientFileUpload: true,

            // Transpiles SDK to be compatible with IE11 (increases bundle size)
            transpileClientSDK: true,

            // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
            tunnelRoute: '/monitoring',

            // Hides source maps from generated client bundles
            hideSourceMaps: true,

            // Automatically tree-shake Sentry logger statements to reduce bundle size
            disableLogger: true
          },
        `,
      )
      .replace(
        /\(nextConfig\)/gm,
        `(withSentryConfig(nextConfig, sentryWebpackPluginOptions))`,
      );

    tree.write(
      `apps/${options.directory}/next.config.js`,
      nextConfigContent +
        `
           /**
       * @type {import('@sentry/nextjs').SentryWebpackPluginOptions}
       **/
      
      const sentryWebpackPluginOptions = {
        silent: true,
        org: '',
        project: 'web-next-js-client',
        authToken: process.env.SENTRY_AUTH_TOKEN,
      };
      
      `,
    );

    const envFiles = ['.env', '.env.development', '.env.production'];
    envFiles.forEach((file) => {
      const envContent = tree
        .read(`apps/${options.directory}/${file}`)
        .toString();
      tree.write(
        `apps/${options.directory}/${file}`,
        envContent + 'SENTRY_AUTH_TOKEN=',
      );
    });

    generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);
  } else if (options.technology === Technology.REACT_NATIVE) {
    addDependenciesToPackageJson(tree, mobileDependencies, {});

    const layoutContent = tree
      .read(`apps/${options.directory}/app/_layout.tsx`)
      .toString()
      .replace(
        /^import { Stack } from 'expo-router';$/gm,
        `import { Stack } from 'expo-router';import * as Sentry from "@sentry/react-native";import Constants from "expo-constants";`,
      )
      .replace(/^export default function RootLayout/gm, `function RootLayout`);

    tree.write(
      `apps/${options.directory}/app/_layout.tsx`,
      layoutContent +
        `
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

    const appConfigContent = tree
      .read(`apps/${options.directory}/app.config.ts`)
      .toString()
      .replace(
        /plugins: \[/g,
        `plugins: [ [
        '@sentry/react-native/expo',
        {
          // TODO Update organization and project name
          organization: '',
          project: ''
        }
      ],`,
      );

    tree.write(`apps/${options.directory}/app.config.ts`, appConfigContent);
  }

  await formatFiles(tree);
}

export default sentryGenerator;
