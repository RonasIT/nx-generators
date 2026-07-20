const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');
const path = require('path');

const appRoot = __dirname;
const monorepoRoot = path.resolve(appRoot, '../..');
const defaultConfig = getDefaultConfig(appRoot);
const { assetExts, sourceExts } = defaultConfig.resolver;
const watchFolders = Array.from(new Set([...defaultConfig.watchFolders, monorepoRoot]));

const { paths: tsconfigPaths = {} } = require('../../tsconfig.base.json').compilerOptions;
const defaultResolveRequest = defaultConfig.resolver?.resolveRequest;

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
    extraNodeModules: {
      i18n: path.resolve(monorepoRoot, 'i18n'),
    },
    resolveRequest: (context, moduleName, platform) => {
      const alias = tsconfigPaths[moduleName];
      if (alias?.[0]) {
        return { filePath: path.resolve(monorepoRoot, alias[0]), type: 'sourceFile' };
      }
      if (defaultResolveRequest) {
        return defaultResolveRequest(context, moduleName, platform);
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  watchFolders,
};

module.exports = mergeConfig(defaultConfig, customConfig);
