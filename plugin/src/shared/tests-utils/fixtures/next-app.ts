export const nextConfigComposeWithNxMinimal = `const { composePlugins, withNx } = require('@nx/next/plugins/with-nx');

const nextConfig = {
  nx: {},
};

module.exports = composePlugins(withNx(nextConfig));
`;
