//@ts-check
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');
const { withSentryConfig } = require('@sentry/nextjs');
/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: true,
  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
  tunnelRoute: '/monitoring',
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
};
const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

/**
 * @type {import('@sentry/nextjs').SentryWebpackPluginOptions}
 **/

const sentryWebpackPluginOptions = {
  silent: true,
  org: '',
  project: 'web-next-js-client',
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

module.exports = composePlugins(...plugins)(
  withSentryConfig(nextConfig, sentryWebpackPluginOptions),
);
