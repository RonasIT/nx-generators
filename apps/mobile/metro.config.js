const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');
const path = require('path');

const appRoot = __dirname;
const monorepoRoot = path.resolve(appRoot, '../..');
const defaultConfig = getDefaultConfig(appRoot);
const { assetExts, sourceExts } = defaultConfig.resolver;
const watchFolders = Array.from(new Set([...defaultConfig.watchFolders, monorepoRoot]));
/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const customConfig = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
  },
  watchFolders,
};

module.exports = mergeConfig(defaultConfig, customConfig);
