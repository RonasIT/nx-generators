const withNextIntl = require('next-intl/plugin')();

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  output: 'standalone',
  reactCompiler: true,
  async redirects() {
    return [];
  },
};

module.exports = withNextIntl(nextConfig);
